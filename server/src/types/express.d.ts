import 'express';

declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            userId: string;
            email: string;
            username: string;
            iat: number;
            exp: number;
        };
    }
}
