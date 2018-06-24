declare module 'skip-request' {
    let get: GetRequest;
    let post: PostRequest;
    let fake: FakeResponse;

    interface Ca {
        certFilePath?: string|undefined, 
        keyFilePath?: string|undefined, 
        pfxFilePath?: string|undefined
    }
    class BaseRequest {
        url(url: string): this;
        header(header: object): this;
        cookie(url: string, cookies: object): this;
        proxy(host: string, port: number): this;
        timeout(microSecond: number): this;
        query(query: object): this;
        ca(certConfig: Ca, passphrase: string): this;
        submit(): Response;
    }

    interface GetRequest extends BaseRequest {}

    interface PostRequest extends BaseRequest {
        form(form: object): this;
        json(json: object): this;
        xml(xml: string): this;
        text(text: string): this;
        mutilForm(form: object): this;
    }

    interface Response {
        status: number;
        har: object;
        toJson(): object;
        toString(): string;
        toBuffer(): Buffer;
        toFile(filePath: string): string;
    }

    type FCallback = (request: FRequest, response: FResponse) => void;
    interface FRequest {
        url: string;
        method: string;
        headers: object;
        cookies: object;
        body: string | object;
        timeout: number;
        query: object;
    }

    interface FResponse {
        status(status: number): this;
        text(text: string): this;
        json(json: object): this;
        file(filePath: string): this;
        xml(text: string): this;
    }

    interface FakeResponse {
        post(url: string, callback: FCallback): void;
        get(url: string, callback: FCallback): void;
    }


}