import {
    ensureURL,
    mergeUrlLike,
} from './undici-client';
import { config, StepTester, RunphaseTarget } from '@hacker-und-koch/di';
import { UndiciClient, UndiciClientOptions } from '.';

const devHome = 'http://localhost:8080';

describe("ensureURL", () => {
    it("passes through URL type", () => {
        const url1 = new URL(devHome);
        expect(ensureURL(url1)).toBe(url1);
    });
    it("transforms simple input to URL", () => {
        expect(ensureURL(devHome)).toBeInstanceOf(URL);
    });
    it("adds missing protocol to prevent errors", () => {
        expect(ensureURL('127.0.0.1/test').href).toEqual('https://127.0.0.1/test');
    });
    it("adds missing host to prevent errors", () => {
        expect(ensureURL('/test').href).toEqual('https://localhost/test');
    });
    it("can handle empty string input", () => {
        expect(ensureURL('').href).toEqual('https://localhost/');
    })
});


describe("mergeUrlLike", () => {
    it("overwrites according to node logic", () => {
        const base1 = new URL('http://test.host:8080');
        const base2 = new URL('http://test.host:8080/api/v1/');

        expect(mergeUrlLike(base1, '/foo').href).toEqual('http://test.host:8080/foo');
        expect(mergeUrlLike(base2, '/bar').href).toEqual('http://test.host:8080/bar');
        expect(mergeUrlLike(base1, 'https://localhost/lorem').href).toEqual('https://localhost/lorem');
        // more of an fyi
        expect(mergeUrlLike(base1, 'localhost/ipsum').href).toEqual('http://test.host:8080/localhost/ipsum');
        expect(mergeUrlLike(base2, '').href).toEqual('http://test.host:8080/api/v1/');
    });
});

describe("UndiciClient", () => {
    const tester = StepTester.withTarget(UndiciClient)
        .options({
            configurations: [
                config<UndiciClientOptions>(UndiciClient, {
                    url: 'http://127.0.5.6'
                })
            ]


        })
        .runUntilAfter('configure');

    it("evaluates configuration", async () => {
        const runtime = await tester.build();

        expect(runtime.instance.url).toBeInstanceOf(URL);
        expect(runtime.instance.url.href).toEqual('http://127.0.5.6/');
    });

    it("request function respects config when calling performInternalRequest", async () => {
        const runtime = await tester.build();
        const spy = runtime.spyWithReturn('performInternalRequest', 'kek');

        expect(await runtime.instance.request('/test')).toEqual('kek' as any);
        expect(spy).toHaveBeenCalledOnceWith(new URL('http://127.0.5.6/test'), { headers: {} });
    });
});
