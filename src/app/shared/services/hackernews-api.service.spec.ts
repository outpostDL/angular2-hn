import { HackerNewsAPIService } from './hackernews-api.service';
import { Story } from '../models/story';
import { PollResult } from '../models/poll-result';

import * as unfetchModule from 'unfetch';

describe('HackerNewsAPIService', () => {
    let service: HackerNewsAPIService;
    let fetchSpy: jasmine.Spy;

    function makeResponse(data: any): any {
        return {
            ok: true,
            statusText: 'OK',
            status: 200,
            url: '',
            text: () => Promise.resolve(JSON.stringify(data)),
            json: () => Promise.resolve(data),
            blob: () => Promise.resolve(new Blob()),
            clone: function() { return makeResponse(data); },
            headers: {
                keys: () => [] as string[],
                entries: () => [] as Array<[string, string]>,
                get: (_key: string) => undefined,
                has: (_key: string) => false,
            },
        };
    }

    function mockFetchResponse(data: any): void {
        fetchSpy.and.returnValue(Promise.resolve(makeResponse(data)));
    }

    function mockFetchResponseSequence(responses: any[]): void {
        let callIndex = 0;
        fetchSpy.and.callFake(() => {
            const data = responses[callIndex] || responses[responses.length - 1];
            callIndex++;
            return Promise.resolve(makeResponse(data));
        });
    }

    function mockFetchRejection(error: any): void {
        fetchSpy.and.returnValue(Promise.reject(error));
    }

    beforeEach(() => {
        fetchSpy = spyOn(unfetchModule, 'default').and.returnValue(
            Promise.resolve(makeResponse({}))
        );
        service = new HackerNewsAPIService();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set baseUrl to node-hnapi.herokuapp.com', () => {
        expect(service.baseUrl).toBe('https://node-hnapi.herokuapp.com');
    });

    describe('fetchFeed', () => {
        it('should construct URL with feedType and page', (done: DoneFn) => {
            const mockItems: Story[] = [{ id: 1, title: 'Test' } as Story];
            mockFetchResponse(mockItems);

            service.fetchFeed('news', 2).subscribe((items) => {
                expect(fetchSpy).toHaveBeenCalledWith(
                    'https://node-hnapi.herokuapp.com/news?page=2',
                    undefined
                );
                expect(items).toEqual(mockItems);
                done();
            });
        });

        it('should construct URL for different feed types', (done: DoneFn) => {
            mockFetchResponse([]);

            service.fetchFeed('newest', 1).subscribe(() => {
                expect(fetchSpy).toHaveBeenCalledWith(
                    'https://node-hnapi.herokuapp.com/newest?page=1',
                    undefined
                );
                done();
            });
        });
    });

    describe('fetchItemContent', () => {
        it('should pass through non-poll stories', (done: DoneFn) => {
            const mockStory: Story = {
                id: 123,
                title: 'Test Story',
                type: 'story',
                url: 'http://example.com',
            } as Story;
            mockFetchResponse(mockStory);

            service.fetchItemContent(123).subscribe((story) => {
                expect(story.id).toBe(123);
                expect(story.title).toBe('Test Story');
                done();
            });
        });

        it('should fetch poll options and aggregate poll_votes_count for poll stories', (done: DoneFn) => {
            const mockPollStory: any = {
                id: 100,
                title: 'Poll Story',
                type: 'poll',
                poll: [null, null], // 2 poll options
                poll_votes_count: 0,
            };
            const pollResult1: PollResult = { points: 10, content: 'Option A' };
            const pollResult2: PollResult = { points: 20, content: 'Option B' };

            // First call returns poll story, subsequent calls return poll results
            mockFetchResponseSequence([mockPollStory, pollResult1, pollResult2]);

            service.fetchItemContent(100).subscribe((story) => {
                expect(story.type).toBe('poll');
                // The poll options should be fetched with ids story.id + 1, story.id + 2
                expect(fetchSpy).toHaveBeenCalledWith(
                    'https://node-hnapi.herokuapp.com/item/101',
                    undefined
                );
                expect(fetchSpy).toHaveBeenCalledWith(
                    'https://node-hnapi.herokuapp.com/item/102',
                    undefined
                );
                done();
            });
        });
    });

    describe('fetchPollContent', () => {
        it('should construct correct URL for poll content', (done: DoneFn) => {
            const mockPoll: PollResult = { points: 5, content: 'Option' };
            mockFetchResponse(mockPoll);

            service.fetchPollContent(456).subscribe((result) => {
                expect(fetchSpy).toHaveBeenCalledWith(
                    'https://node-hnapi.herokuapp.com/item/456',
                    undefined
                );
                expect(result).toEqual(mockPoll);
                done();
            });
        });
    });

    describe('fetchUser', () => {
        it('should construct correct URL for user', (done: DoneFn) => {
            const mockUser = { id: 'pg', karma: 1000 };
            mockFetchResponse(mockUser);

            service.fetchUser('pg').subscribe((user) => {
                expect(fetchSpy).toHaveBeenCalledWith(
                    'https://node-hnapi.herokuapp.com/user/pg',
                    undefined
                );
                expect(user.id).toBe('pg');
                done();
            });
        });
    });

    describe('lazyFetch cancellation', () => {
        it('should not emit data when subscription is cancelled before fetch resolves', (done: DoneFn) => {
            let resolvePromise: Function;
            fetchSpy.and.returnValue(
                new Promise((resolve) => {
                    resolvePromise = resolve;
                })
            );

            const nextSpy = jasmine.createSpy('next');
            const subscription = service.fetchFeed('news', 1).subscribe(nextSpy);

            subscription.unsubscribe();

            resolvePromise(makeResponse([{ id: 1 }]));

            setTimeout(() => {
                expect(nextSpy).not.toHaveBeenCalled();
                done();
            }, 50);
        });
    });

    describe('error propagation', () => {
        it('should propagate fetch rejection as observable error', (done: DoneFn) => {
            const testError = new Error('Network failure');
            mockFetchRejection(testError);

            service.fetchFeed('news', 1).subscribe(
                () => fail('should not emit'),
                (error) => {
                    expect(error).toBe(testError);
                    done();
                }
            );
        });
    });
});
