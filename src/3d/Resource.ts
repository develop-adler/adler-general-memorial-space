export class Resource {
    readonly id: string;
    readonly url: string;
    isAvailable: boolean = false;
    checkedAvailability: boolean = false;

    constructor(id: string, url: string) {
        this.id = id;
        this.url = url;
    }

    async checkAvailability(): Promise<boolean> {
        const res = await fetch(this.url, { method: "HEAD" });
        this.isAvailable = res.ok && res.status === 200;
        this.checkedAvailability = true;
        return this.isAvailable;
    }
}
