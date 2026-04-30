import { Platform } from 'react-native';

const API_URL_PC = 'http://localhost:8080';
const API_URL_CELULAR = 'http://192.168.18.12:8080';

export const API_URL = Platform.OS === 'web' ? API_URL_PC : API_URL_CELULAR;
