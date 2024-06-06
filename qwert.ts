import { v4 as uuidv4 } from 'uuid';

interface User {
  status: number;
  id: string;
  login: string;
  password: string;
  online: boolean;
  verified: boolean;
  phoneNumber?: string;
  age?: number;
  cardNumber?: string;
  country?: string;
  tokens: {
    type: string;
    amount: number;
  }[];
  transactions: {
    id: string;
    from: string;
    to: string;
    amount: number;
    date: Date;
  }[];
}

const users: User[] = [];

const signUp = (login: string, password: string, repeatPassword: string): { status: number, text: string, message: string } => {
  if (!login  !password  !repeatPassword) {
    return { status: 400, text: 'Bad Request', message: 'Не все поля заполнены' };
  }

  if (password !== repeatPassword) {
    return { status: 400, text: 'Bad Request', message: 'Пароли не совпадают' };
  }

  if (login.length < 4 || login.length > 16) {
    return { status: 400, text: 'Bad Request', message: 'Длина логина должна быть от 4 до 16 символов' };
  }

  if (password.length < 6 || password.length > 32) {
    return { status: 400, text: 'Bad Request', message: 'Длина пароля должна быть от 6 до 32 символов' };
  }

  if (!/^[a-zA-Z0-9]+$/.test(login)) {
    return { status: 400, text: 'Bad Request', message: 'Логин может содержать только латинские буквы и цифры' };
  }

  const existingUser = users.find((user) => user.login === login);
  if (existingUser) {
    return { status: 409, text: 'Conflict', message: 'Логин уже занят' };
  }

  const newUser = {
    id: uuidv4(),
    login,
    password,
    online: false,
    verified: false,
    tokens: [],
    transactions: [],
  };

  users.push(newUser);

  signIn(login, password);

  return { status: 200, text: 'OK', message: 'Регистрация успешна' };
};

const signIn = (login: string, password: string): { status: number, text: string, message: string } => {
  const user = users.find((user) => user.login === login && user.password === password);
  if (!user) {
    return { status: 401, text: 'Unauthorized', message: 'Неверный логин или пароль' };
  }

  user.online = true;

  return { status: 200, text: 'OK', message: 'Вход успешен' };
};

const verify = (password: string, phoneNumber: string, age: number, cardNumber: string, country: string): { status: number, text: string, message: string } => {
  const user = users.find((user) => user.password === password);
  if (!user) {
    return { status: 401, text: 'Unauthorized', message: 'Неверный пароль' };
  }

  if (phoneNumber) {
    user.phoneNumber = phoneNumber;
  }

  if (age) {
    user.age = age;
  }

  if (cardNumber) {
    user.cardNumber = cardNumber;
  }

  if (country) {
    user.country = country;
  }

  user.verified = true;

  return { status: 200, text: 'OK', message: 'Верификация успешна' };
};

const forgetPwd = (phoneNumber: string, password: string): { status: number, text: string, message: string } => {
  const user = users.find((user) => user.phoneNumber === phoneNumber);
  if (!user) {
    return { status: 404, text: 'Not Found', message: 'Пользователь не найден' };
  }

  if (user.password !== password) {
    return { status: 401, text: 'Unauthorized', message: 'Неверный пароль' };
  }

  return { status: 200, text: 'OK', message: 'Пароль сброшен' };
};

const transactionTrigger = (uid: string, amount: number): { status: number, text: string, message: string } => {
  const sender = users.find((user) => user.id === uid);
  if (!sender) {
    return { status: 404, text: 'Not Found', message: 'Пользователь не найден' };
  }

  if (amount <= 0) {
    return { status: 400, text: 'Bad Request', message: 'Сумма должна быть больше нуля' };
  }

  const receiver = users.find((user) => user.id === uid);
  if (!receiver) {
    return { status: 404, text: 'Not Found', message: 'Пользователь не найден' };
  }

  if (sender.tokens.length === 0) {
    return { status: 400, text: 'Bad Request', message: 'У Вас нет токенов' };
  }

  const senderToken = sender