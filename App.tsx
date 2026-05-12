import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { GlobalContextProviders } from "./components/_globalContextProviders";
import Page_0 from "./pages/ai.tsx";
import PageLayout_0 from "./pages/ai.pageLayout.tsx";
import Page_1 from "./pages/map.tsx";
import PageLayout_1 from "./pages/map.pageLayout.tsx";
import Page_2 from "./pages/about.tsx";
import PageLayout_2 from "./pages/about.pageLayout.tsx";
import Page_3 from "./pages/login.tsx";
import PageLayout_3 from "./pages/login.pageLayout.tsx";
import Page_4 from "./pages/terms.tsx";
import PageLayout_4 from "./pages/terms.pageLayout.tsx";
import Page_5 from "./pages/_index.tsx";
import PageLayout_5 from "./pages/_index.pageLayout.tsx";
import Page_6 from "./pages/invest.tsx";
import PageLayout_6 from "./pages/invest.pageLayout.tsx";
import Page_7 from "./pages/contact.tsx";
import PageLayout_7 from "./pages/contact.pageLayout.tsx";
import Page_8 from "./pages/privacy.tsx";
import PageLayout_8 from "./pages/privacy.pageLayout.tsx";
import Page_9 from "./pages/dashboard.tsx";
import PageLayout_9 from "./pages/dashboard.pageLayout.tsx";
import Page_10 from "./pages/invest.kyc.tsx";
import PageLayout_10 from "./pages/invest.kyc.pageLayout.tsx";
import Page_11 from "./pages/properties.tsx";
import PageLayout_11 from "./pages/properties.pageLayout.tsx";
import Page_12 from "./pages/superadmin.tsx";
import PageLayout_12 from "./pages/superadmin.pageLayout.tsx";
import Page_13 from "./pages/admin.users.tsx";
import PageLayout_13 from "./pages/admin.users.pageLayout.tsx";
import Page_14 from "./pages/add-property.tsx";
import PageLayout_14 from "./pages/add-property.pageLayout.tsx";
import Page_15 from "./pages/subscription.tsx";
import PageLayout_15 from "./pages/subscription.pageLayout.tsx";
import Page_16 from "./pages/invest.wallet.tsx";
import PageLayout_16 from "./pages/invest.wallet.pageLayout.tsx";
import Page_17 from "./pages/admin.activity.tsx";
import PageLayout_17 from "./pages/admin.activity.pageLayout.tsx";
import Page_18 from "./pages/admin.dashboard.tsx";
import PageLayout_18 from "./pages/admin.dashboard.pageLayout.tsx";
import Page_19 from "./pages/invest.offering.tsx";
import PageLayout_19 from "./pages/invest.offering.pageLayout.tsx";
import Page_20 from "./pages/account-settings.tsx";
import PageLayout_20 from "./pages/account-settings.pageLayout.tsx";
import Page_21 from "./pages/admin.compliance.tsx";
import PageLayout_21 from "./pages/admin.compliance.pageLayout.tsx";
import Page_22 from "./pages/admin.properties.tsx";
import PageLayout_22 from "./pages/admin.properties.pageLayout.tsx";
import Page_23 from "./pages/invest.portfolio.tsx";
import PageLayout_23 from "./pages/invest.portfolio.pageLayout.tsx";
import Page_24 from "./pages/admin.tokenization.tsx";
import PageLayout_24 from "./pages/admin.tokenization.pageLayout.tsx";
import Page_25 from "./pages/admin.subscriptions.tsx";
import PageLayout_25 from "./pages/admin.subscriptions.pageLayout.tsx";
import Page_26 from "./pages/admin.tokenization-kyc.tsx";
import PageLayout_26 from "./pages/admin.tokenization-kyc.pageLayout.tsx";
import Page_27 from "./pages/admin.tokenization-income.tsx";
import PageLayout_27 from "./pages/admin.tokenization-income.pageLayout.tsx";
import Page_28 from "./pages/dashboards.tsx";
import PageLayout_28 from "./pages/dashboards.pageLayout.tsx";
import Page_29 from "./pages/fractional-ownership.tsx";
import PageLayout_29 from "./pages/fractional-ownership.pageLayout.tsx";
import Page_30 from "./pages/tokenization.tsx";
import PageLayout_30 from "./pages/tokenization.pageLayout.tsx";
import Page_31 from "./pages/subscription.apply.tsx";
import PageLayout_31 from "./pages/subscription.apply.pageLayout.tsx";
import Page_32 from "./pages/subscription.status.tsx";
import PageLayout_32 from "./pages/subscription.status.pageLayout.tsx";
import Page_33 from "./pages/admin.subscription-approvals.tsx";
import PageLayout_33 from "./pages/admin.subscription-approvals.pageLayout.tsx";
import Page_34 from "./pages/secondary-market.tsx";
import PageLayout_34 from "./pages/secondary-market.pageLayout.tsx";
import Page_35 from "./pages/admin.fractional-ownership.tsx";
import PageLayout_35 from "./pages/admin.fractional-ownership.pageLayout.tsx";
import Page_36 from "./pages/admin.secondary-market.tsx";
import PageLayout_36 from "./pages/admin.secondary-market.pageLayout.tsx";

if (!window.requestIdleCallback) {
  window.requestIdleCallback = (cb) => {
    setTimeout(cb, 1);
  };
}

import "./base.css";

const fileNameToRoute = new Map([["./pages/ai.tsx","/ai"],["./pages/map.tsx","/map"],["./pages/about.tsx","/about"],["./pages/login.tsx","/login"],["./pages/terms.tsx","/terms"],["./pages/_index.tsx","/"],["./pages/invest.tsx","/invest"],["./pages/contact.tsx","/contact"],["./pages/privacy.tsx","/privacy"],["./pages/dashboard.tsx","/dashboard"],["./pages/invest.kyc.tsx","/invest/kyc"],["./pages/properties.tsx","/properties"],["./pages/superadmin.tsx","/superadmin"],["./pages/admin.users.tsx","/admin/users"],["./pages/add-property.tsx","/add-property"],["./pages/subscription.tsx","/subscription"],["./pages/invest.wallet.tsx","/invest/wallet"],["./pages/admin.activity.tsx","/admin/activity"],["./pages/admin.dashboard.tsx","/admin/dashboard"],["./pages/invest.offering.tsx","/invest/offering"],["./pages/account-settings.tsx","/account-settings"],["./pages/admin.compliance.tsx","/admin/compliance"],["./pages/admin.properties.tsx","/admin/properties"],["./pages/invest.portfolio.tsx","/invest/portfolio"],["./pages/admin.tokenization.tsx","/admin/tokenization"],["./pages/admin.subscriptions.tsx","/admin/subscriptions"],["./pages/admin.tokenization-kyc.tsx","/admin/tokenization-kyc"],["./pages/admin.tokenization-income.tsx","/admin/tokenization-income"],["./pages/dashboards.tsx","/dashboards"],["./pages/fractional-ownership.tsx","/fractional-ownership"],["./pages/tokenization.tsx","/tokenization"],["./pages/subscription.apply.tsx","/subscription/apply"],["./pages/subscription.status.tsx","/subscription/status"],["./pages/admin.subscription-approvals.tsx","/admin/subscription-approvals"],["./pages/secondary-market.tsx","/secondary-market"],["./pages/admin.fractional-ownership.tsx","/admin/fractional-ownership"],["./pages/admin.secondary-market.tsx","/admin/secondary-market"]]);
const fileNameToComponent = new Map([
    ["./pages/ai.tsx", Page_0],
["./pages/map.tsx", Page_1],
["./pages/about.tsx", Page_2],
["./pages/login.tsx", Page_3],
["./pages/terms.tsx", Page_4],
["./pages/_index.tsx", Page_5],
["./pages/invest.tsx", Page_6],
["./pages/contact.tsx", Page_7],
["./pages/privacy.tsx", Page_8],
["./pages/dashboard.tsx", Page_9],
["./pages/invest.kyc.tsx", Page_10],
["./pages/properties.tsx", Page_11],
["./pages/superadmin.tsx", Page_12],
["./pages/admin.users.tsx", Page_13],
["./pages/add-property.tsx", Page_14],
["./pages/subscription.tsx", Page_15],
["./pages/invest.wallet.tsx", Page_16],
["./pages/admin.activity.tsx", Page_17],
["./pages/admin.dashboard.tsx", Page_18],
["./pages/invest.offering.tsx", Page_19],
["./pages/account-settings.tsx", Page_20],
["./pages/admin.compliance.tsx", Page_21],
["./pages/admin.properties.tsx", Page_22],
["./pages/invest.portfolio.tsx", Page_23],
["./pages/admin.tokenization.tsx", Page_24],
["./pages/admin.subscriptions.tsx", Page_25],
["./pages/admin.tokenization-kyc.tsx", Page_26],
["./pages/admin.tokenization-income.tsx", Page_27],
["./pages/dashboards.tsx", Page_28],
["./pages/fractional-ownership.tsx", Page_29],
["./pages/tokenization.tsx", Page_30],
["./pages/subscription.apply.tsx", Page_31],
["./pages/subscription.status.tsx", Page_32],
["./pages/admin.subscription-approvals.tsx", Page_33],
["./pages/secondary-market.tsx", Page_34],
["./pages/admin.fractional-ownership.tsx", Page_35],
["./pages/admin.secondary-market.tsx", Page_36],
  ]);

function makePageRoute(filename: string) {
  const Component = fileNameToComponent.get(filename);
  return <Component />;
}

function toElement({
  trie,
  fileNameToRoute,
  makePageRoute,
}: {
  trie: LayoutTrie;
  fileNameToRoute: Map<string, string>;
  makePageRoute: (filename: string) => React.ReactNode;
}) {
  return [
    ...trie.topLevel.map((filename) => (
      <Route
        key={fileNameToRoute.get(filename)}
        path={fileNameToRoute.get(filename)}
        element={makePageRoute(filename)}
      />
    )),
    ...Array.from(trie.trie.entries()).map(([Component, child], index) => (
      <Route
        key={index}
        element={
          <Component>
            <Outlet />
          </Component>
        }
      >
        {toElement({ trie: child, fileNameToRoute, makePageRoute })}
      </Route>
    )),
  ];
}

type LayoutTrieNode = Map<
  React.ComponentType<{ children: React.ReactNode }>,
  LayoutTrie
>;
type LayoutTrie = { topLevel: string[]; trie: LayoutTrieNode };
function buildLayoutTrie(layouts: {
  [fileName: string]: React.ComponentType<{ children: React.ReactNode }>[];
}): LayoutTrie {
  const result: LayoutTrie = { topLevel: [], trie: new Map() };
  Object.entries(layouts).forEach(([fileName, components]) => {
    let cur: LayoutTrie = result;
    for (const component of components) {
      if (!cur.trie.has(component)) {
        cur.trie.set(component, {
          topLevel: [],
          trie: new Map(),
        });
      }
      cur = cur.trie.get(component)!;
    }
    cur.topLevel.push(fileName);
  });
  return result;
}

function NotFound() {
  return (
    <div>
      <h1>Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <p>Go back to the <a href="/" style={{ color: 'blue' }}>home page</a>.</p>
    </div>
  );
}

import { useLocation, useNavigationType } from "react-router-dom";

export default function ScrollManager() {
  const { pathname, search, hash } = useLocation();
  const navType = useNavigationType(); // "PUSH" | "REPLACE" | "POP"

  useEffect(() => {
    // Back/forward: keep browser-like behavior
    if (navType === "POP") return;

    // Hash links: let the browser scroll to the anchor
    if (hash) return;

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, search, hash, navType]);

  return null;
}

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <ScrollManager />
      <GlobalContextProviders>
        <Routes>
          {toElement({ trie: buildLayoutTrie({
"./pages/ai.tsx": PageLayout_0,
"./pages/map.tsx": PageLayout_1,
"./pages/about.tsx": PageLayout_2,
"./pages/login.tsx": PageLayout_3,
"./pages/terms.tsx": PageLayout_4,
"./pages/_index.tsx": PageLayout_5,
"./pages/invest.tsx": PageLayout_6,
"./pages/contact.tsx": PageLayout_7,
"./pages/privacy.tsx": PageLayout_8,
"./pages/dashboard.tsx": PageLayout_9,
"./pages/invest.kyc.tsx": PageLayout_10,
"./pages/properties.tsx": PageLayout_11,
"./pages/superadmin.tsx": PageLayout_12,
"./pages/admin.users.tsx": PageLayout_13,
"./pages/add-property.tsx": PageLayout_14,
"./pages/subscription.tsx": PageLayout_15,
"./pages/invest.wallet.tsx": PageLayout_16,
"./pages/admin.activity.tsx": PageLayout_17,
"./pages/admin.dashboard.tsx": PageLayout_18,
"./pages/invest.offering.tsx": PageLayout_19,
"./pages/account-settings.tsx": PageLayout_20,
"./pages/admin.compliance.tsx": PageLayout_21,
"./pages/admin.properties.tsx": PageLayout_22,
"./pages/invest.portfolio.tsx": PageLayout_23,
"./pages/admin.tokenization.tsx": PageLayout_24,
"./pages/admin.subscriptions.tsx": PageLayout_25,
"./pages/admin.tokenization-kyc.tsx": PageLayout_26,
"./pages/admin.tokenization-income.tsx": PageLayout_27,
"./pages/dashboards.tsx": PageLayout_28,
"./pages/fractional-ownership.tsx": PageLayout_29,
"./pages/tokenization.tsx": PageLayout_30,
"./pages/subscription.apply.tsx": PageLayout_31,
"./pages/subscription.status.tsx": PageLayout_32,
"./pages/admin.subscription-approvals.tsx": PageLayout_33,
"./pages/secondary-market.tsx": PageLayout_34,
"./pages/admin.fractional-ownership.tsx": PageLayout_35,
"./pages/admin.secondary-market.tsx": PageLayout_36,
}), fileNameToRoute, makePageRoute })} 
          <Route path="*" element={<NotFound />} />
        </Routes>
      </GlobalContextProviders>
    </BrowserRouter>
  );
}
