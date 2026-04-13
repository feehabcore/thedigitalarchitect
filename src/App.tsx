/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import {AppProvider, useApp} from '@/src/context/AppContext';
import Layout from '@/src/components/Layout';
import Home from '@/src/components/Home';
import Analytics from '@/src/components/Analytics';
import Savings from '@/src/components/Savings';
import Profile from '@/src/components/Profile';
import Transactions from '@/src/components/Transactions';
import Onboarding from '@/src/components/Onboarding';
import AddTransactionSheet from '@/src/components/AddTransactionSheet';
import GlobalSearchSheet from '@/src/components/GlobalSearchSheet';
import type {Screen} from '@/src/types';

function Shell() {
  const {profile} = useApp();
  const [currentScreen, setCurrentScreen] = React.useState<Screen>('home');
  const [addOpen, setAddOpen] = React.useState(false);
  const [addInitialType, setAddInitialType] = React.useState<'income' | 'expense' | undefined>(undefined);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [focusTransactionId, setFocusTransactionId] = React.useState<string | null>(null);

  if (!profile) {
    return <Onboarding />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <Home
            onAddIncomeExpense={(t) => {
              setAddInitialType(t);
              setAddOpen(true);
            }}
            onViewTransactions={() => setCurrentScreen('transactions')}
          />
        );
      case 'analytics':
        return <Analytics />;
      case 'savings':
        return <Savings />;
      case 'profile':
        return <Profile onOpenTransactions={() => setCurrentScreen('transactions')} />;
      case 'transactions':
        return (
          <Transactions
            onAdd={() => {
              setAddInitialType('expense');
              setAddOpen(true);
            }}
            onBack={() => setCurrentScreen('home')}
            focusTransactionId={focusTransactionId}
            onConsumedFocus={() => setFocusTransactionId(null)}
          />
        );
      default:
        return (
          <Home
            onAddIncomeExpense={(t) => {
              setAddInitialType(t);
              setAddOpen(true);
            }}
            onViewTransactions={() => setCurrentScreen('transactions')}
          />
        );
    }
  };

  return (
    <>
      <Layout
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
        addSheetOpen={addOpen}
        onOpenAdd={() => {
          setAddInitialType('expense');
          setAddOpen(true);
        }}
        onOpenSearch={() => setSearchOpen(true)}
      >
        {renderScreen()}
      </Layout>
      <AddTransactionSheet
        open={addOpen}
        initialType={addInitialType}
        onClose={() => {
          setAddOpen(false);
          setAddInitialType(undefined);
        }}
      />
      <GlobalSearchSheet
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectTransaction={(id) => {
          setFocusTransactionId(id);
          setCurrentScreen('transactions');
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
