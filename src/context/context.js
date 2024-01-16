import React, { useState, useEffect, createContext } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
    const [gitHubUser, setgitHubUser] = useState(mockUser);
    const [repos, setRepos] = useState(mockRepos);
    const [followers, setfollowers] = useState(mockFollowers);
    const [requests, setRequests] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState({ show: false, msg: '' });

    const checkRequeats = () => {
        axios(`${rootUrl}/rate_limit`)
            .then(({ data }) => {
                let {
                    rate: { remaining }
                } = data;
                setRequests(remaining);
                if (remaining === 0) {
                    toggleMsg(true, 'you haave exceeded your hourly limit request!');
                }
            })
            .catch(err => console.log(err));
    };
    function toggleMsg(show = 'false', msg = '') {
        setError({ show, msg });
    }
    const searchGitHubUser = async (user) => {
        toggleMsg();
        setLoading(true);
        const response = await axios(`${rootUrl}/users/${user}`).catch((error) => console.log(error));
        if(response){
            setgitHubUser(response.data);
            const{login, followers_url} = response.data;
            await Promise.allSettled([ axios(`${rootUrl}/users/${login}/repos/?per_page=100`),axios(`${followers_url}?per_page=100`)]).then((results) => {
                const [repos, followers] = results;
                const status = 'fulfilled';
                if(repos.status === status){
                    setRepos(repos.value.data)
                }
                if(followers.status === status){
                    setfollowers(followers.value.data)
                }
            }).catch((err) => console.log(err))
        }else{
            toggleMsg(true,'There is no user found!')
        }
        checkRequeats();
        setLoading(false);
    }
    useEffect(() => {
        checkRequeats();
    }, []);
    return (
        <GithubContext.Provider
            value={{ gitHubUser, repos, followers, setfollowers, setgitHubUser, setRepos, requests, error,searchGitHubUser,loading }}
        >
            {children}
        </GithubContext.Provider>
    );
};

export { GithubProvider, GithubContext };
