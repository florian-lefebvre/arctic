import { TimeSpan, createDate } from "oslo";
import { OAuth2Controller } from "oslo/oauth2";

const authorizeEndpoint = "https://discord.com/oauth2/authorize";
const tokenEndpoint = "https://discord.com/api/oauth2/token";

export class Discord {
	private controller: OAuth2Controller;
	private scope: string[];
	private clientSecret: string;

	constructor(
		clientId: string,
		clientSecret: string,
		redirectURI: string,
		options?: {
			scope?: string[];
		}
	) {
		this.controller = new OAuth2Controller(clientId, authorizeEndpoint, tokenEndpoint, {
			redirectURI
		});
		this.scope = options?.scope ?? [];
		this.scope.push("identify");
		this.clientSecret = clientSecret;
	}

	public async createAuthorizationURL(state: string): Promise<URL> {
		return await this.controller.createAuthorizationURL({
			state,
			scope: this.scope
		});
	}

	public async validateAuthorizationCode(code: string): Promise<DiscordTokens> {
		const result = await this.controller.validateAuthorizationCode<TokenResponseBody>(code, {
			authenticateWith: "request_body",
			credentials: this.clientSecret
		});
		return {
			accessToken: result.access_token,
			refreshToken: result.refresh_token,
			accessTokenExpiresAt: createDate(new TimeSpan(result.expires_in, "s"))
		};
	}

	public async getUser(accessToken: string): Promise<DiscordUser> {
		const response = await fetch("https://discord.com/api/users/@me", {
			headers: {
				Authorization: ["Bearer", accessToken].join(" ")
			}
		});
		return await response.json();
	}

	public async refreshAccessToken(refreshToken: string): Promise<DiscordTokens> {
		const result = await this.controller.refreshAccessToken<TokenResponseBody>(refreshToken, {
			authenticateWith: "request_body",
			credentials: this.clientSecret
		});
		return {
			accessToken: result.access_token,
			refreshToken: result.refresh_token,
			accessTokenExpiresAt: createDate(new TimeSpan(result.expires_in, "s"))
		};
	}
}

interface TokenResponseBody {
	access_token: string;
	expires_in: number;
	refresh_token: string;
}

export interface DiscordTokens {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresAt: Date;
}

export interface DiscordUser {
	id: string;
	username: string;
	discriminator: string;
	global_name: string | null;
	avatar: string | null;
	bot?: boolean;
	system?: boolean;
	mfa_enabled?: boolean;
	verified?: boolean;
	email?: string | null;
	flags?: number;
	banner?: string | null;
	accent_color?: number | null;
	premium_type?: number;
	public_flags?: number;
	locale?: string;
	avatar_decoration?: string | null;
}
