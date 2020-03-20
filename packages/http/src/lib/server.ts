import { Injectable, Option, OnInit, OnDestroy, Configuration, InjectConfiguration } from "@tna/di";
import { Logger } from "@tna/logger";
import { Server as HttpServer, ServerResponse, IncomingMessage } from 'http';
import { Socket } from "dgram";

export interface ServerConfiguration {
    host?: string;
    port?: number;
}


@Injectable()
export class Server implements OnInit, OnDestroy {
    private connections: Socket[] = [];
    private server: HttpServer;
    private listening: boolean = false;

    @InjectConfiguration<ServerConfiguration>({
        host: '127.0.0.1',
        port: 8080,
    })
    private config: ServerConfiguration;

    constructor(private logger: Logger) {

    }

    onInit(): Promise<void> {
        return this.initializeServer();
    }

    set handler(fn: (req: IncomingMessage, res: ServerResponse) => any) {
        this.handle = fn;
    }

    private handle(req: IncomingMessage, res: ServerResponse) {
        res.statusCode = 500;
        res.write('No handler defined!');
        res.end();
    }

    private initializeServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server = new HttpServer((req: IncomingMessage, res: ServerResponse) => {
                this.logger.spam(`${req.method} ${req.url}`);
                this.handle(req, res);
            });

            this.server.on('connection', (socket: Socket) => {
                this.connections.push(socket);

                socket.once('close', () => {
                    try {
                        this.connections.splice(this.connections.indexOf(socket), 1);
                    } catch (e) {
                        this.logger.error('Failed to remove connection from list.', e);
                    }
                });
            });

            const { host, port } = this.config;
            this.server.listen(Number(port), host, () => {
                this.logger.info(`Listening on http://${host}:${port}`);
                this.listening = true;
                resolve();
            });

            this.server.once('error', e => {
                this.logger.warn('Will shutdown Server because of an error.');
                this.shutdown()
                    .then(() => {
                        throw e;
                    });
            });

        });
    }

    async onDestroy(): Promise<void> {
        return this.shutdown();
    }

    shutdown(): Promise<void> {
        this.logger.info('Shutting down.')
        if (this.listening) {
            return Promise.all([
                new Promise<void>((resolve, reject) => {
                    this.server.close((err) => {
                        if (err) {
                            this.logger.info('Server closed.');
                            this.listening = false;
                            reject(err);
                            return;
                        }
                        resolve();
                    });
                }),
                new Promise<void>((resolve, reject) => {
                    this.logger.spam(`Closing ${this.connections.length} connections.`);
                    Promise.all(
                        this.connections.map(conn =>
                            new Promise(resolve => {
                                (conn as any).destroy();
                                conn.on('close', resolve);
                            })
                        )
                    )
                        .then(() => {
                            this.connections = [];
                            this.logger.info('All connections closed.')
                            resolve();
                        })
                        .catch(reject);
                })
            ])
                .then(() => Promise.resolve());
        }
        return Promise.resolve();
    }
}
