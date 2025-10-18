"use client"; // このファイルがクライアントサイドで実行されることを宣言

import { useState } from "react";

// 投稿フォームコンポーネント
// ユーザーが新しいブログ投稿を作成するためのフォームを提供します。
// このコンポーネントは、他のページ（例: app/blog/new/page.tsx）からインポートして再利用することを想定しています。
export default function PostForm() {
  // 投稿タイトルを管理するstate
  const [title, setTitle] = useState("");
  // 投稿内容を管理するstate
  const [content, setContent] = useState("");
  // 投稿カテゴリを管理するstate
  const [category, setCategory] = useState("");

  // フォーム送信時のハンドラー関数
  // ユーザーが入力したデータをAPIに送信し、投稿を作成します。
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // デフォルトのフォーム送信動作を防止

    // フォームから送信されるデータをコンソールに出力して確認
    console.log("📌 送信データ:", { title, content, category }); // 💡 콘솔 메시지 변경

    // ローカルストレージから認証トークンを取得
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    // トークンが存在しない場合、ユーザーにログインを促し処理を中断
    if (!token) {
      alert("ログインが必要です。"); // 
      return;
    }

    // 新しい投稿データをAPIエンドポイントにPOSTリクエストとして送信
    const res = await fetch("/api/posts", {
      method: "POST", // HTTPメソッドはPOST
      headers: {
        "Content-Type": "application/json", // リクエストボディの形式はJSON
        "Authorization": `Bearer ${token}`, // 認証ヘッダーにJWTトークンを含める
      },
      body: JSON.stringify({ // リクエストボディをJSON文字列に変換
        title,
        content,
        category: category || "デフォルト値", // 
      }),
    });

    // サーバーからの応答をJSON形式で解析
    const data = await res.json();
    console.log("📌 サーバー応答:", data); // 

    // レスポンスが成功ステータス (res.ok) の場合
    if (res.ok) {
      alert("記事が登録されました！"); // 
      // フォームフィールドをクリア
      setTitle("");
      setContent("");
      setCategory("");
    } else {
      // レスポンスがエラーの場合
      alert(`エラーが発生しました: ${data.error}`); // 
    }
  };

  return (
    // 投稿フォームのUI
    // Tailwind CSSのフレックスボックスで要素を縦方向に並べ、ギャップを設定
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* タイトル入力フィールド */}
      <input
        type="text"
        placeholder="タイトル" // 
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required // 必須入力フィールド
        className="border p-2" // スタイル
      />
      {/* 内容入力テキストエリア */}
      <textarea
        placeholder="内容" // 
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required // 必須入力フィールド
        className="border p-2" // スタイル
      />
      {/* カテゴリ入力フィールド */}
      <input
        type="text"
        placeholder="カテゴリー" // 
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="border p-2" // スタイル
      />
      {/* 投稿登録ボタン */}
      <button type="submit" className="bg-blue-500 text-white p-2 rounded">
        登録 
      </button>
    </form>
  );
}