import { errorHandler, AppError } from '../utils/errorHandling';

console.log('AppError', errorHandler(new AppError('test','E100','low','User msg')));
console.log('Generic', errorHandler(new Error('Oops')));