import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../helpers/useAuth";
import { OAuthButtonGroup } from "../components/OAuthButtonGroup";
import { PasswordLoginForm } from "../components/PasswordLoginForm";
import { PasswordRegisterForm } from "../components/PasswordRegisterForm";
import { DemoAccountAccess } from "../components/DemoAccountAccess";
import { ThemeModeSwitch } from "../components/ThemeModeSwitch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/Tabs";
import styles from "./login.module.css";

export default function LoginPage() {
  const { authState } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  // Redirect if already authenticated
  if (authState.type === "authenticated") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <ThemeModeSwitch />
      </div>
      
      <div className={styles.content}>
        <div className={styles.logoContainer}>
          <h1 className={styles.logo}>
            سكني<span className={styles.logoSuffix}>.xyz</span>
          </h1>
          <p className={styles.tagline}>منصة سكني الذكية للعقارات</p>
          <p className={styles.subTagline}>Your Smart Real Estate Platform</p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.welcomeTitle}>
            {activeTab === "login" ? "Welcome Back" : "Get Started"}
          </h2>
          <p className={styles.welcomeText}>
            {activeTab === "login"
              ? "Sign in to access your account"
              : "Create your account"}
          </p>

          <Tabs 
            defaultValue="login" 
            onValueChange={setActiveTab} 
            className={styles.tabs}
          >
            <TabsList className={styles.tabsList}>
              <TabsTrigger value="login" className={styles.tabsTrigger}>Sign In</TabsTrigger>
              <TabsTrigger value="register" className={styles.tabsTrigger}>Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className={styles.tabContent}>
              <div className={styles.authButtons}>
                <OAuthButtonGroup />
              </div>

              <div className={styles.divider}>
                <span className={styles.dividerText}>or</span>
              </div>

              <PasswordLoginForm />

              <p className={styles.demoCredentials}>
                💡 Demo password for all accounts: demo123
              </p>
              <DemoAccountAccess />
            </TabsContent>
            
            <TabsContent value="register" className={styles.tabContent}>
              <PasswordRegisterForm />
              
              <p className={styles.upgradeNote}>
                ✨ You can upgrade to premium plans after creating your account.
              </p>
            </TabsContent>
          </Tabs>
          
          <p className={styles.terms}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
