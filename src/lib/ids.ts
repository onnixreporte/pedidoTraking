import { customAlphabet, nanoid } from 'nanoid';

const PUBLIC_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

export const genPublicId = customAlphabet(PUBLIC_ALPHABET, 8);
export const genAdminToken = () => nanoid(21);
