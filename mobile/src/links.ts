import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { API_URL } from './api';

export const CONTACT = {
  phone: '+998 99 913 97 57',
  phoneUrl: 'tel:+998999139757',
  telegram: 't.me/izzatillokuu',
  telegramUrl: 'https://t.me/izzatillokuu',
  instagram: 'instagram.com/izzatillo.man',
  instagramUrl: 'https://instagram.com/izzatillo.man',
};

export const openPrivacy = () => WebBrowser.openBrowserAsync(`${API_URL}/legal/privacy`);
export const openTerms = () => WebBrowser.openBrowserAsync(`${API_URL}/legal/terms`);
export const openSupport = () => WebBrowser.openBrowserAsync(`${API_URL}/support`);
export const openUrl = (url: string) => Linking.openURL(url);
