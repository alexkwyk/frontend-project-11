import i18next from 'i18next';
import * as yup from 'yup';
import _ from 'lodash';
import axios from 'axios';
import ru from './locales/ru.js';
import view from './view.js';
import parse from './parser.js';

const setIds = (data) => {
  const feedId = _.uniqueId();
  const { title, description } = data.feed;
  const feed = { feedId, title, description };
  const posts = data.posts.map((post) => ({ feedId, id: _.uniqueId(), ...post }));
  return { feed, posts };
};

const generateURL = (link) => {
  const url = new URL('https://allorigins.hexlet.app/get');
  url.searchParams.append('disableCache', 'true');
  url.searchParams.append('url', link);
  return url;
};

const getFeedsPostsFromURL = (link) => axios.get(generateURL(link))
  .catch(() => {
    throw new Error('networkError');
  })
  .then((response) => {
    const parsedData = parse(response.data.contents);
    return setIds(parsedData);
  })
  .catch((e) => {
    throw new Error(e.message);
  });

export default () => {
  const createi18nextInstance = (lng = 'ru') => {
    const i18nextInstance = i18next.createInstance();
    Promise.resolve(i18nextInstance.init({
      lng,
      resources: { ru },
    }));
    return i18nextInstance;
  };
  const i18nextInstance = createi18nextInstance();

  const intialState = {
    state: 'intial',
    error: '',
    links: [],
    feeds: [],
    posts: [],
    readPosts: [],
    modalPost: '',
  };
  const state = view(intialState, i18nextInstance);

  yup.setLocale({
    mixed: {
      notOneOf: 'duplicate',
      required: 'required',
    },
    string: {
      url: 'invalidUrl',
    },
  });

  const schema = yup.string().url().required();

  const form = document.querySelector('form.rss-form');
  const postsContainer = document.querySelector('.posts');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputURL = (e.target.elements.url.value).trim();

    schema.notOneOf(state.links).validate(inputURL)
      .then(() => {
        state.state = 'loading';
        return getFeedsPostsFromURL(inputURL);
      })
      .then((normalizedData) => {
        state.feeds.unshift(normalizedData.feed);
        state.posts.unshift(...normalizedData.posts);
        state.links.unshift(inputURL);
        e.target.reset();
        e.target.elements.url.focus();
        state.state = 'loaded';
      })
      .catch((err) => {
        state.error = err.message;
        state.state = 'failed';
      });
  });

  postsContainer.addEventListener('click', (e) => {
    const { id } = e.target.dataset;
    if (!id) return;
    state.readPosts.push(id);
    state.modalPost = id;
  });

  const checkForNewPosts = () => {
    const run = () => {
      const promises = state.links
        .map((link, index) => getFeedsPostsFromURL(link)
          .then((response) => {
            const { feedId } = state.feeds[index];
            const filteredPosts = state.posts.filter((post) => post.feedId === feedId);
            const currentNewPosts = _.differenceBy(response.posts, filteredPosts, 'title')
              .map((post) => ({ feedId, id: _.uniqueId, ...post }));
            if (currentNewPosts.length > 0) {
              state.posts.unshift(...currentNewPosts);
              state.state = 'loaded';
            }
          })
          .catch((err) => {
            state.error = err.message;
            state.state = 'failed';
            throw new Error(err.message);
          }));
      Promise.all(promises).finally(() => setTimeout(run, 5000));
    };

    setTimeout(run, 5000);
  };

  checkForNewPosts();
};
