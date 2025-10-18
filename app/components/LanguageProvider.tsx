"use client"; // このファイルがクライアントサイドで実行されることを宣言

import { createContext, useContext, useState, useEffect } from "react";

// LanguageContextの作成
// アプリケーション全体で現在の言語とそれを変更する関数を共有するために使用されます。
// デフォルト値として "en" と空のsetLang関数が設定されています。
const LanguageContext = createContext<{ lang: string; setLang: (lang: string) => void }>({
  lang: "en", // デフォルトの言語
  setLang: () => {}, // デフォルトの言語設定関数 (何もしない関数)
});

// useLangカスタムフック
// コンポーネントがLanguageContextに簡単にアクセスできるようにするユーティリティフックです。
// これを使用することで、現在の言語 (lang) と言語を変更する関数 (setLang) を取得できます。
export const useLang = () => useContext(LanguageContext);

// LanguageProviderコンポーネント
// アプリケーションツリーの配下にある子コンポーネントに言語コンテキストを提供します。
// ローカルストレージに言語設定を永続化するロジックを含みます。
// @param children - LanguageContextにアクセスできる子Reactノード
export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  // 現在の言語状態を管理するstate (デフォルトは"en")
  const [lang, setLang] = useState("en");

  // コンポーネントのマウント時に一度だけ実行されるエフェクトフック
  // ローカルストレージから保存された言語設定を読み込み、stateを初期化します。
  useEffect(() => {
    const storedLang = localStorage.getItem("lang"); // ローカルストレージから"lang"キーの値を取得
    if (storedLang) {
      setLang(storedLang); // 保存された言語があればstateに設定
    }
  }, []); // 空の依存配列により、コンポーネントがマウントされた時のみ実行

  // 言語を変更し、ローカルストレージに保存する関数
  // @param newLang - 設定する新しい言語コード (例: "en", "ja")
  const changeLang = (newLang: string) => {
    setLang(newLang); // stateを新しい言語に更新
    localStorage.setItem("lang", newLang); // ローカルストレージにも新しい言語を保存
  };

  return (
    // LanguageContext.Providerを使用して、langとchangeLang関数を子コンポーネントに提供
    <LanguageContext.Provider value={{ lang, setLang: changeLang }}>
      {children} {/* コンテキストにアクセスできる子要素 */}
    </LanguageContext.Provider>
  );
};