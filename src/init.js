import i18next from 'i18next';
import app from './app.js';

const resources = {
  ru: {
    translation: {
      invalidUrl: 'Ссылка должна быть валидным URL',
      duplicate: 'RSS уже существует',
      required: 'Не должно быть пустым',
      success: 'RSS успешно загружен',
      networkError: 'Ошибка сети',
      rssError: 'Ресурс не содержит валидный RSS',
      posts: 'Посты',
      postsButton: 'Просмотр',
      feeds: 'Фиды',
    },
  },
};

export default async (lang = 'ru') => {
  const i18nextInstance = i18next.createInstance();
  Promise.resolve(i18nextInstance.init({
    lng: lang,
    resources,
  }));
  app(i18nextInstance);
};
