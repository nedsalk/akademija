type StaticRouteConfig = {
  base: string;
  $?: DynamicRouteConfig;
  [key: string]: string | RouteConfig | undefined;
};

type DynamicRouteConfig = {
  param: string;
  $?: DynamicRouteConfig;
  [key: string]: string | RouteConfig | undefined;
};

type RouteConfig = StaticRouteConfig | DynamicRouteConfig;

type RoutesConfig = {
  [key: string]: StaticRouteConfig;
};

type InternalRouteKey = "$" | "base" | "param";
type RouteChildKey<T> = Exclude<keyof T, InternalRouteKey> & string;
type EmptyParams = Record<never, never>;

type JoinRouteKey<Prefix extends string, Key extends string> = Prefix extends ""
  ? Key
  : `${Prefix}.${Key}`;

type RootPath<Segment extends string> = Segment extends "" ? "/" : `/${Segment}`;
type AppendPath<ParentPath extends string, Segment extends string> = Segment extends ""
  ? ParentPath extends ""
    ? "/"
    : ParentPath
  : ParentPath extends "" | "/"
    ? `/${Segment}`
    : `${ParentPath}/${Segment}`;

type AddParam<Params extends object, Param extends string> = Params & {
  [K in Param]: string;
};

export type ParsedRoute<
  RouteKey extends string = string,
  Params extends object = Record<string, string>,
> = {
  params: Params;
  routeKey: RouteKey;
};

type WildcardPath<BasePath extends string> = BasePath extends "/" ? "/*" : `${BasePath}/*`;

type StaticRouteChildMatches<
  T extends RouteConfig,
  Prefix extends string,
  Params extends object,
> = {
  [K in RouteChildKey<T>]: T[K] extends string
    ? ParsedRoute<JoinRouteKey<Prefix, K>, Params>
    : T[K] extends StaticRouteConfig
      ? RouteNodeMatches<T[K], JoinRouteKey<Prefix, K>, Params>
      : never;
}[RouteChildKey<T>];

type DynamicRouteChildMatches<
  T extends RouteConfig,
  Prefix extends string,
  Params extends object,
> = T extends { $: infer Dynamic extends DynamicRouteConfig }
  ? RouteNodeMatches<
      Dynamic,
      JoinRouteKey<Prefix, "$">,
      AddParam<Params, Dynamic["param"] & string>
    >
  : never;

type RouteChildMatches<T extends RouteConfig, Prefix extends string, Params extends object> =
  | StaticRouteChildMatches<T, Prefix, Params>
  | DynamicRouteChildMatches<T, Prefix, Params>;

type RouteNodeMatches<
  T extends RouteConfig,
  Prefix extends string,
  Params extends object,
> = Prefix extends ""
  ? RouteChildMatches<T, Prefix, Params>
  : ParsedRoute<Prefix, Params> | RouteChildMatches<T, Prefix, Params>;

type RoutesMatch<T extends RoutesConfig> = {
  [K in keyof T & string]: RouteNodeMatches<T[K], K, EmptyParams>;
}[keyof T & string];

type DynamicParamArg<
  T extends DynamicRouteConfig,
  Param extends string | number,
> = Param extends `:${string}` ? (Param extends `:${T["param"] & string}` ? Param : never) : Param;

type DynamicPath<ParentPath extends string, Param extends string | number> = Param extends string
  ? Param extends `:${string}`
    ? AppendPath<ParentPath, Param>
    : string
  : string;

type DynamicParams<Params extends object, Param extends string | number> = Param extends string
  ? Param extends `:${infer ParamName}`
    ? AddParam<Params, ParamName>
    : Params
  : Params;

type WildcardBasePath<Pattern extends string> = Pattern extends "/*"
  ? "/"
  : Pattern extends `${infer BasePath}/*`
    ? BasePath
    : never;

type ExactPathMatch<Left extends string, Right extends string> = Left extends Right
  ? Right extends Left
    ? true
    : false
  : false;

type StaticChildWildcardMatch<
  T extends RouteConfig,
  TargetPath extends string,
  BasePath extends string,
  Params extends object,
> = {
  [K in RouteChildKey<T>]: T[K] extends StaticRouteConfig
    ? RouteWildcardMatch<T[K], TargetPath, AppendPath<BasePath, T[K]["base"]>, Params>
    : never;
}[RouteChildKey<T>];

type DynamicChildWildcardMatch<
  T extends RouteConfig,
  TargetPath extends string,
  BasePath extends string,
  Params extends object,
> = T extends { $: infer Dynamic extends DynamicRouteConfig }
  ? RouteWildcardMatch<
      Dynamic,
      TargetPath,
      AppendPath<BasePath, `:${Dynamic["param"] & string}`>,
      AddParam<Params, Dynamic["param"] & string>
    >
  : never;

type RouteWildcardMatch<
  T extends RouteConfig,
  TargetPath extends string,
  BasePath extends string,
  Params extends object,
> =
  ExactPathMatch<BasePath, TargetPath> extends true
    ? RouteChildMatches<T, "", Params>
    :
        | StaticChildWildcardMatch<T, TargetPath, BasePath, Params>
        | DynamicChildWildcardMatch<T, TargetPath, BasePath, Params>;

type RoutesWildcardMatch<T extends RoutesConfig, Pattern extends string> = {
  [K in keyof T & string]: RouteWildcardMatch<
    T[K],
    WildcardBasePath<Pattern>,
    RootPath<T[K]["base"]>,
    EmptyParams
  >;
}[keyof T & string];

type RouteGroupControls<
  T extends RouteConfig,
  BasePath extends string,
  PatternParams extends object,
> = {
  toString(): BasePath;
  $_wildcard: WildcardPath<BasePath>;
  parse(path: string): RouteChildMatches<T, "", PatternParams> | null;
};

type RouteChildResults<
  T extends RouteConfig,
  ParentPath extends string,
  PatternParams extends object,
> = {
  [K in RouteChildKey<T>]: T[K] extends StaticRouteConfig
    ? RouteResult<T[K], AppendPath<ParentPath, T[K]["base"]>, PatternParams>
    : T[K] extends string
      ? `/${T[K]}`
      : never;
} & {
  [K in RouteChildKey<T> as `$${K}`]: T[K] extends StaticRouteConfig
    ? AppendPath<ParentPath, T[K]["base"]>
    : T[K] extends string
      ? AppendPath<ParentPath, T[K]>
      : never;
};

type RouteResult<
  T extends RouteConfig,
  ParentPath extends string = string,
  PatternParams extends object = EmptyParams,
> = RouteGroupControls<T, ParentPath, PatternParams> &
  RouteChildResults<T, ParentPath, PatternParams> &
  (T extends { $: infer Dynamic extends DynamicRouteConfig }
    ? {
        $<const P extends string | number>(
          param: DynamicParamArg<Dynamic, P>,
        ): RouteResult<Dynamic, DynamicPath<ParentPath, P>, DynamicParams<PatternParams, P>>;
      }
    : {});

type RoutesResult<T extends RoutesConfig> = {
  [K in keyof T]: RouteResult<T[K], RootPath<T[K]["base"]>>;
} & {
  [K in keyof T as `$${string & K}`]: RootPath<T[K]["base"]>;
} & {
  parse(path: string): RoutesMatch<T> | null;
  parse<const P extends `${string}/*`>(pattern: P, path: string): RoutesWildcardMatch<T, P> | null;
};

type RuntimeMatch = ParsedRoute<string, Record<string, string>>;

type WildcardMatcher = {
  config: RouteConfig;
  prefixSegments: string[];
};

const wildcardMatchers = new Map<string, WildcardMatcher>();

function isStaticRouteConfig(value: unknown): value is StaticRouteConfig {
  return typeof value === "object" && value !== null && "base" in value;
}

function isDynamicRouteConfig(value: unknown): value is DynamicRouteConfig {
  return typeof value === "object" && value !== null && "param" in value;
}

function appendPath(parentPath: string, segment: string) {
  if (!segment) {
    return parentPath || "/";
  }

  if (!parentPath || parentPath === "/") {
    return `/${segment}`;
  }

  return `${parentPath}/${segment}`;
}

function appendWildcard(basePath: string) {
  return basePath === "/" ? "/*" : `${basePath}/*`;
}

function splitPath(path: string) {
  const [pathname = ""] = path.split(/[?#]/);
  return pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });
}

function routeKey(prefix: string, key: string) {
  return prefix ? `${prefix}.${key}` : key;
}

function routeChildKeys(config: RouteConfig) {
  return Object.keys(config).filter((key) => key !== "base" && key !== "param" && key !== "$");
}

function matchPrefix(prefixSegments: string[], pathSegments: string[]) {
  if (pathSegments.length < prefixSegments.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (const [index, segment] of prefixSegments.entries()) {
    const pathSegment = pathSegments[index];
    if (!pathSegment) {
      return null;
    }

    if (segment.startsWith(":")) {
      params[segment.slice(1)] = pathSegment;
      continue;
    }

    if (segment !== pathSegment) {
      return null;
    }
  }

  return params;
}

function matchRouteGroup(
  config: RouteConfig,
  parts: string[],
  prefix: string,
  params: Record<string, string>,
  includeSelf: boolean,
): RuntimeMatch | null {
  if (includeSelf && prefix && parts.length === 0) {
    return { params, routeKey: prefix };
  }

  for (const key of routeChildKeys(config)) {
    const value = config[key];

    if (typeof value === "string") {
      if (parts.length === 1 && parts[0] === value) {
        return { params, routeKey: routeKey(prefix, key) };
      }
      continue;
    }

    if (!isStaticRouteConfig(value)) {
      continue;
    }

    if (parts[0] !== value.base) {
      continue;
    }

    const match = matchRouteGroup(value, parts.slice(1), routeKey(prefix, key), params, true);
    if (match) {
      return match;
    }
  }

  const dynamic = config.$;
  if (!isDynamicRouteConfig(dynamic) || parts.length === 0) {
    return null;
  }

  const [paramValue, ...remainingParts] = parts;
  if (!paramValue) {
    return null;
  }

  return matchRouteGroup(
    dynamic,
    remainingParts,
    routeKey(prefix, "$"),
    { ...params, [dynamic.param]: paramValue },
    true,
  );
}

function matchRoutes(config: RoutesConfig, parts: string[]): RuntimeMatch | null {
  for (const [key, value] of Object.entries(config)) {
    if (!value.base && parts.length === 0) {
      return { params: {}, routeKey: key };
    }

    if (parts[0] !== value.base) {
      continue;
    }

    const match = matchRouteGroup(value, parts.slice(1), key, {}, true);
    if (match) {
      return match;
    }
  }

  return null;
}

function matchWildcard(pattern: string, path: string) {
  const matcher = wildcardMatchers.get(pattern);
  if (!matcher) {
    return null;
  }

  const pathSegments = splitPath(path);
  const prefixParams = matchPrefix(matcher.prefixSegments, pathSegments);
  if (!prefixParams) {
    return null;
  }

  const suffix = pathSegments.slice(matcher.prefixSegments.length);
  if (suffix.length === 0) {
    return null;
  }

  return matchRouteGroup(matcher.config, suffix, "", prefixParams, false);
}

function createRouteGroup<const T extends RouteConfig>(config: T, parentPath = ""): RouteResult<T> {
  const basePath = isStaticRouteConfig(config) ? appendPath(parentPath, config.base) : parentPath;

  const result: Record<string, unknown> = {};

  for (const key of Object.keys(config)) {
    if (key === "base" || key === "param") continue;

    const value = config[key];

    if (key === "$" && isDynamicRouteConfig(value)) {
      result.$ = (param: string | number) => {
        if (typeof param === "string" && param.startsWith(":") && param !== `:${value.param}`) {
          throw new Error(`Expected route param :${value.param}, received ${param}`);
        }

        const dynamicPath = appendPath(basePath, String(param));
        return createRouteGroup(value, dynamicPath) as unknown;
      };
    } else if (isStaticRouteConfig(value)) {
      const nested = createRouteGroup(value, basePath);
      result[key] = nested;
      result[`$${key}`] = appendPath(basePath, value.base);
    } else if (typeof value === "string") {
      result[key] = `/${value}`;
      result[`$${key}`] = appendPath(basePath, value);
    }
  }

  const wildcard = appendWildcard(basePath);
  wildcardMatchers.set(wildcard, {
    config,
    prefixSegments: splitPath(basePath),
  });

  Object.defineProperty(result, "$_wildcard", {
    value: wildcard,
    enumerable: false,
    writable: false,
    configurable: false,
  });

  Object.defineProperty(result, "parse", {
    value: (path: string) => {
      const parts = splitPath(path);
      const prefixParams = path.startsWith("/") ? matchPrefix(splitPath(basePath), parts) : {};
      if (!prefixParams) {
        return null;
      }
      const suffix = path.startsWith("/") ? parts.slice(splitPath(basePath).length) : parts;
      return matchRouteGroup(config, suffix, "", prefixParams, false);
    },
    enumerable: false,
    writable: false,
    configurable: false,
  });

  Object.defineProperty(result, "toString", {
    value: () => basePath,
    enumerable: false,
    writable: false,
    configurable: false,
  });

  return result as RouteResult<T>;
}

export function createRoutes<const T extends RoutesConfig>(config: T): RoutesResult<T> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(config)) {
    const basePath = appendPath("", value.base);
    const routeGroup = createRouteGroup(value);
    result[key] = routeGroup;
    result[`$${key}`] = basePath;
  }

  Object.defineProperty(result, "parse", {
    value: (patternOrPath: string, path?: string) => {
      if (typeof path === "string") {
        return matchWildcard(patternOrPath, path);
      }

      return matchRoutes(config, splitPath(patternOrPath));
    },
    enumerable: false,
    writable: false,
    configurable: false,
  });

  return result as RoutesResult<T>;
}

export const routes = createRoutes({
  home: {
    base: "",
  },
  manifest: {
    base: "manifest.webmanifest",
  },
  serviceWorker: {
    base: "service-worker.js",
  },
  auth: {
    base: "auth",
    login: "login",
    register: "register",
    logout: "logout",
  },
  programs: {
    base: "programs",
    create: "create",
    $: {
      param: "programId",
      edit: "edit",
      enroll: "enroll",
      courses: {
        base: "courses",
        $: {
          param: "courseId",
          delete: "delete",
          textbook: "textbook",
          assessments: {
            base: "assessments",
            weekly: "weekly",
            final: "final",
            $: {
              param: "assessmentId",
              submit: "submit",
            },
          },
          attendance: {
            base: "attendance",
            acknowledge: "acknowledge",
            evaluate: "evaluate",
            rule: "rule",
          },
          certificate: "certificate",
          lessons: {
            base: "lessons",
            reorder: "reorder",
            $: {
              param: "lessonId",
              answers: "answers",
              delete: "delete",
              discussions: {
                base: "discussions",
                $: {
                  param: "discussionId",
                  approve: "approve",
                  reply: "reply",
                },
              },
              edit: "edit",
              complete: "complete",
              questions: {
                base: "questions",
              },
            },
          },
        },
      },
    },
  },
  enrollments: {
    base: "enrollments",
    $: {
      param: "programId",
      enrollmentRequests: {
        base: "enrollment-requests",
        $: {
          param: "studentId",
          approve: "approve",
          reject: "reject",
        },
      },
    },
  },
  teacher: {
    base: "teacher",
  },
  admin: {
    base: "admin",
    users: {
      base: "users",
      changeRole: "change-role",
    },
  },
  profile: {
    base: "profile",
    notifications: {
      base: "notifications",
      subscribe: "subscribe",
    },
  },
  api: {
    base: "api",
    auth: {
      base: "auth",
    },
    test: {
      base: "test",
      setRole: "set-role",
      getSession: "get-session",
      setNow: "set-now",
      resetNow: "reset-now",
      notifications: "notifications",
    },
  },
} as const);
