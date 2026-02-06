/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as anime from "../anime.js";
import type * as auth from "../auth.js";
import type * as forums from "../forums.js";
import type * as friends from "../friends.js";
import type * as http from "../http.js";
import type * as httpActions from "../httpActions.js";
import type * as listComments from "../listComments.js";
import type * as lists from "../lists.js";
import type * as userAnime from "../userAnime.js";
import type * as userProfiles from "../userProfiles.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  anime: typeof anime;
  auth: typeof auth;
  forums: typeof forums;
  friends: typeof friends;
  http: typeof http;
  httpActions: typeof httpActions;
  listComments: typeof listComments;
  lists: typeof lists;
  userAnime: typeof userAnime;
  userProfiles: typeof userProfiles;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
