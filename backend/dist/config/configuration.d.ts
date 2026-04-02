declare const _default: () => {
    app: {
        port: number;
        nodeEnv: string;
        frontendUrl: string;
        jwtSecret: string;
    };
    database: {
        url: string;
        synchronize: boolean;
        dropSchema: boolean;
    };
};
export default _default;
