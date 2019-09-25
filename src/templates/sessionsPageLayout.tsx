import React, { useEffect, useState } from 'react';
import RichText from './../components/richText/richText';
import Helmet from 'react-helmet';
import { graphql } from 'gatsby';
import base from './../services/firebase';
import { AuthService } from './../services/authentication'
import Layout from './../components/layout';
import Session, { SessionProps } from './../components/session/session';

import './sessionsPageLayout.scss';

const SessionsPageLayout = (props: any) => {

    const [favoritedSessions, setFavoritedSessions] = useState<string[]>([]);
    const [sessionFilter, setSessionFilter] = useState<SessionFilter>(SessionFilter.ALL);

    useEffect(() => {
        async function getFavoritedSessions() {
            const favoritedSessions = await base.fetch(`2019/${ AuthService.getUser().userId }/favorited-sessions`, { context: { }, asArray: true });

            setFavoritedSessions(favoritedSessions.map(((favorite: any) => favorite.contentfulId)));
        }

        if (AuthService.isLoggedIn()) {
            getFavoritedSessions();
        }
    }, []);

    useEffect((): void => {
        const sessionId: string = window.location.hash.replace('#', '');

        if (sessionId) {
            const session: HTMLElement | null = document.getElementById(sessionId);

            if (session) {
                session.scrollIntoView();
            }
        }
    }, []);

    const onSessionFavorited = async (favoritedSessionId: string) => {
        try {
            await base.post(`2019/${ AuthService.getUser().userId }/favorited-sessions/${ favoritedSessionId }`, { data: { contentfulId: favoritedSessionId } });

            setFavoritedSessions([...favoritedSessions, favoritedSessionId]);
        } catch (error) {
            // tslint:disable-next-line:no-console
            console.error(error);
        }
    };

    const onSessionUnfavorited = async (unfavoritedSessionId: string) => {
        try {
            await base.remove(`2019/${ AuthService.getUser().userId }/favorited-sessions/${ unfavoritedSessionId }`);

            setFavoritedSessions(favoritedSessions.filter(sessionId => sessionId !== unfavoritedSessionId));
        } catch (error) {
            // tslint:disable-next-line:no-console
            console.error(error);
        }
    };

    const setSessionFilterState = (filter: SessionFilter) => {
        setSessionFilter(filter);
    };

    const { sessionsPage, sessions } = props.data;
    const { isActive } = props.pageContext;
    const { page, heading, heroImage, emptyPageContent } = sessionsPage;

    let sessionEdges: any[];

    if (sessionFilter === SessionFilter.FAVORITED) {
        sessionEdges = sessions.edges.filter(({ node }: any) => favoritedSessions.some(id => id === node.id));
    }
    else {
        sessionEdges = sessions.edges;
    }

    const sessionGroups = sessions && sessionEdges ? sessionEdges
        .reduce((result: any, sessionNode: any) => {
            const session = sessionNode.node;
            result[session.startDateTime] = result[session.startDateTime] || [];
            result[session.startDateTime].push(session);

            return result;
        }, { }) : { };

    const sessionGroupsSorted = Object.keys(sessionGroups)
        .sort((a: any, b: any) => {
            const aTime = new Date(a).getTime();
            const bTime = new Date(b).getTime();

            if (aTime > bTime) { return 1; }
            if (aTime < bTime) { return -1; }

            return 0;
        });

    return (
        <Layout className="sessions-page-wrapper" path={ page.slug }>
            <Helmet
                title={ page.title }
                meta={[
                    !!page.socialMediaShareDescription ? { property: 'description', content: page.socialMediaShareDescription } : { },
                    { property: 'og:title', content: page.title },
                    !!page.socialMediaShareDescription ? { property: 'og:description', content: page.socialMediaShareDescription } : { }
                ]}
            />
            <div
                className="hero container-fluid text-center"
                style={{ backgroundImage: `url(${ heroImage.fixed.src })` }}>
                <h1>{ heading }</h1>

            </div>
            {
                isActive ?
                    <div className="container mb-3">
                        <div className="row">
                            <div className="col d-flex justify-content-center">
                            {
                                AuthService.isLoggedIn() ?
                                <div className="btn-group btn-group-toggle" data-toggle="buttons">
                                        <button
                                            className={ `btn ${ sessionFilter === SessionFilter.ALL ? 'btn-primary active' : 'btn-outline-primary' }` }
                                            onClick={ () => setSessionFilterState(SessionFilter.ALL) }>View All</button>
                                        <button
                                            className={ `btn ${ sessionFilter === SessionFilter.FAVORITED ? 'btn-primary active' : 'btn-outline-primary' }` }
                                            onClick={ () => setSessionFilterState(SessionFilter.FAVORITED) }>View Favorites</button>
                                    </div> :
                                    <p>Login to save your favorite sessions!</p>
                            }
                            </div>
                        </div>
                    </div> : null
            }
            <div className="session-groups-container container">
                {
                    !sessions || !sessions.edges || sessions.edges.length === 0 ?
                        /* Empty Page Content: No sessions have been published */
                        <div className="row justify-content-center">
                            <div className="col-12 col-sm-8">
                                <RichText richText={ emptyPageContent.json } />
                            </div>
                        </div> :

                        /* Grouped list of sesions and events by time */
                        <div className="row justify-content-center">
                        {
                            sessionGroupsSorted.map((key: string) => {
                                const groupedSessions = sessionGroups[key];

                                let startTime, endTime = null;

                                const sessionChildren = groupedSessions.map((session: any) => {
                                    startTime = session.startTime;
                                    endTime = session.endTime;

                                    const sessionProps: SessionProps = {
                                        sessionListPageUrl: `${ props.location.origin }${ props.location.pathname }`,
                                        session: {
                                            id: session.id,
                                            title: session.title,
                                            speakers: session.speakers ?
                                                session.speakers.map((speaker: any) => ({ name: speaker.name })) :
                                                undefined,
                                            abstractRichText: session.description.json,
                                            startTime: session.startTime,
                                            endTime: session.endTime,
                                            room: session.room,
                                            category: session.category ? {
                                                name: session.category.name,
                                                colorHex: session.category.color
                                            } : undefined,
                                            sessionType: session.sessionType,
                                            favorite: favoritedSessions.some(sessionId => sessionId === session.id)
                                        },
                                        enableFavoriting: isActive && AuthService.isLoggedIn(),
                                        onSessionFavorited: onSessionFavorited,
                                        onSessionUnfavorited: onSessionUnfavorited
                                    };

                                    return (
                                        <Session key={ session.id } { ...sessionProps } />
                                    );
                                });

                                const displayTime: string = `${ startTime }${ endTime ? ' - ' + endTime : '' }`;

                                return (
                                    <div className="session-group-container col-md-10" key={ key }>
                                        <h4 className="h1 session-group-heading text-center text-sm-left">{ displayTime }</h4>
                                        { sessionChildren }
                                    </div>
                                );
                            })
                        }
                        </div>
                }
            </div>
        </Layout>
    );
};

export default SessionsPageLayout;

enum SessionFilter {
    ALL,
    FAVORITED
}

export const query = graphql`
    query SessionsPageQuery($slug: String!, $conferenceStartOfDay: Date!, $conferenceEndOfDay: Date!) {
        sessionsPage: contentfulSessionsPageLayout(page: {
            slug: {
                eq: $slug
            }
        }) {
            heading
            heroImage {
                fixed(width: 400) {
                    src
                }
            }
            page {
                title
                slug
            }
            emptyPageContent {
                json
            }
        }
        sessions: allContentfulSession(
            filter: {
                startTime: { gte: $conferenceStartOfDay, lt: $conferenceEndOfDay }
            }
        ) {
            edges {
                node {
                    id
                    title
                    description {
                        json
                    }
                    sessionType
                    startDateTime: startTime
                    startTime(formatString: "h:mma")
                    endTime(formatString: "h:mma")
                    room
                    category {
                        name
                        color
                    }
                    speakers {
                        name
                    }
                }
            }
        }
    }`;