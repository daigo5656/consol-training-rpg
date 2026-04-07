// ============================================
// スキルデータ定義（元HTMLから移植）
// ============================================

const SKILL_DATA = [
  // 1. ソリューション設計・企画力
  { id: 1, category: "ソリューション設計・企画力", subCategory: "顧客課題・ビジネスゴールのヒアリング・分析", skillName: "ヒアリングスキル", priority: "高", objective: "顧客との打ち合わせに同席し、議事録の作成を手伝いながら、会話の内容を正確にメモできる。", inputTask: "1. 議事録作成の基本マニュアルを熟読する。\n2. ビジネスヒアリングの基本的なマナーと流れを理解する。\n3. 会話の要点抽出方法に関する教材を学習する。", practiceTask: "1. 2回以上の顧客打ち合わせに同席し、会話内容を正確にメモする。\n2. メモを基に議事録を作成し、上長から正確性のフィードバックを受ける（2回）。", xp: 150 },
  { id: 2, category: "ソリューション設計・企画力", subCategory: "顧客課題・ビジネスゴールのヒアリング・分析", skillName: "業界・企業理解", priority: "高", objective: "顧客の企業名と事業内容を正確に把握できる。", inputTask: "1. 業界の分類方法（BtoB/BtoCなど）と企業調査の基本手順を学ぶ。\n2. 顧客の企業ウェブサイト、SNS、IR情報（公開されている場合）を確認する手順を習得する。", practiceTask: "1. 担当する全顧客（最低5社）について、企業名と事業内容を正確にまとめたリストを作成し提出する。\n2. リストを基に、業界における顧客の立ち位置を口頭で上長に説明する。", xp: 150 },
  { id: 3, category: "ソリューション設計・企画力", subCategory: "顧客課題・ビジネスゴールのヒアリング・分析", skillName: "ゴール設定", priority: "高", objective: "顧客から伝えられた要望（例：「SNSのフォロワーを増やしたい」）を正確に記録できる。", inputTask: "1. KGI、KPI、要望の違いの定義を学ぶ。\n2. 目標と指標の基本的な関連性に関する資料を学習する。", practiceTask: "1. 3件以上のプロジェクトについて、顧客から伝えられた要望を正確に文書化し、上長に提出する。\n2. 記録した要望をKGI/KPIの視点で分類する練習を行う。", xp: 150 },
  { id: 4, category: "ソリューション設計・企画力", subCategory: "市場・競合・トレンド調査・分析", skillName: "調査手法", priority: "小", objective: "検索エンジンを使って指定されたキーワードの情報を収集できる。", inputTask: "1. 検索エンジン（Googleなど）の高度な検索オプションを学ぶ。\n2. 検索ワードの適切な選び方、信頼できる情報源の判別方法を習得する。", practiceTask: "1. 上長から指定されたキーワードで情報を収集し、情報源（URL）と収集日時を明記したリストを作成する（5回）。", xp: 50 },
  { id: 5, category: "ソリューション設計・企画力", subCategory: "市場・競合・トレンド調査・分析", skillName: "データ分析", priority: "中", objective: "上長が指定したデータを収集し、簡単な集計を行える。", inputTask: "1. データの種類（定量/定性）と、収集・集計の基本的な手順を学ぶ。\n2. Excelやスプレッドシートの基本的な集計機能（SUM, AVERAGEなど）を習得する。", practiceTask: "1. 上長が指定した元データ（例：視聴ログ）から、必要な数値を正確に抽出し、簡単な集計結果を提出する（3回）。", xp: 100 },
  { id: 6, category: "ソリューション設計・企画力", subCategory: "市場・競合・トレンド調査・分析", skillName: "トレンド把握", priority: "中", objective: "業界ニュースやSNSで話題になっているトレンドを把握できる。", inputTask: "1. 業界ニュースサイト、主要なSNS、トレンドレポートの購読方法を学ぶ。\n2. トレンド情報の見つけ方、話題性の判断基準を習得する。", practiceTask: "1. 担当業界の最新トレンドを週次で把握し、その中から重要なトレンドを3つ選定して上長に報告する（4週間）。", xp: 100 },
  { id: 7, category: "ソリューション設計・企画力", subCategory: "ターゲット（ペルソナ）・カスタマージャーニー設定", skillName: "ペルソナ作成", priority: "高", objective: "顧客の提示したペルソナ情報を正確に理解し、台本に反映できる。", inputTask: "1. ペルソナの目的と構成要素を学ぶ。\n2. ペルソナ情報が企画や台本に与える影響に関するケーススタディを学習する。", practiceTask: "1. 顧客から提供されたペルソナシートを基に、台本のどの箇所に影響するかを具体的に記述したレポートを作成する。", xp: 150 },
  { id: 8, category: "ソリューション設計・企画力", subCategory: "ターゲット（ペルソナ）・カスタマージャーニー設定", skillName: "カスタマージャーニーマップ作成", priority: "中", objective: "顧客の指示に従い、カスタマージャーニーマップの情報を整理できる。", inputTask: "1. カスタマージャーニーマップの目的と構成要素、各フェーズの定義を学ぶ。\n2. マップ作成ツールの基本的な使い方を習得する。", practiceTask: "1. 既存のプロジェクトについて、顧客の指示に従いジャーニーマップの情報を整理し、正確なマップの初稿を作成する。", xp: 100 },
  { id: 9, category: "ソリューション設計・企画力", subCategory: "企画立案・コンセプト設計", skillName: "発想力", priority: "小", objective: "上長が提示したアイデアに対して、意見を述べることができる。", inputTask: "1. ブレインストーミングの基本的なルール、アイデアを構造化する手法を学ぶ。\n2. 建設的な意見（賛成、反対、追加提案）の述べ方を習得する。", practiceTask: "1. チームのアイデア出し会議に3回参加し、上長が提示したアイデアに対して自身の意見を論理的に述べる。", xp: 50 },
  { id: 10, category: "ソリューション設計・企画力", subCategory: "企画立案・コンセプト設計", skillName: "論理的思考", priority: "中", objective: "企画書の構成要素（目的、ターゲットなど）を理解し、正確に記述できる。", inputTask: "1. 企画書の基本構成要素（目的、ターゲット、コンセプトなど）の定義を学ぶ。\n2. 企画書のテンプレートを分析し、構成要素がどこに該当するかを理解する。", practiceTask: "1. 既存の企画書の構成要素をすべてリストアップし、それぞれの項目を正確に定義した資料を作成する。", xp: 100 },
  { id: 11, category: "ソリューション設計・企画力", subCategory: "企画立案・コンセプト設計", skillName: "コンセプト構築", priority: "高", objective: "顧客の要望に沿って、コンセプトのキーワードをリストアップできる。", inputTask: "1. コンセプトの定義、ターゲットに訴求するキーワードの選び方を学ぶ。\n2. 成功事例のコンセプトの分解演習を行う。", practiceTask: "1. 顧客の要望書を基に、コンセプトに繋がりそうなキーワードを50個以上リストアップし、重要度順に並び替える。", xp: 150 },
  { id: 12, category: "ソリューション設計・企画力", subCategory: "コンテンツマーケティング戦略の策定", skillName: "チャネル選定", priority: "高", objective: "顧客が希望する配信チャネル（YouTube, Instagramなど）を正確に把握できる。", inputTask: "1. 主要な配信チャネルの特性（ユーザー層、動画尺など）を学ぶ。\n2. 顧客のビジネスモデルに合うチャネルの選定基準を理解する。", practiceTask: "1. 顧客のコンテンツ目的に対し、チャネルの特性を踏まえた選定理由を文書で説明する。", xp: 150 },
  { id: 13, category: "ソリューション設計・企画力", subCategory: "コンテンツマーケティング戦略の策定", skillName: "SEO/MEO/ASO", priority: "小", objective: "SEOやASOといった用語の意味を理解できる。", inputTask: "1. SEO、ASOといった用語の意味と目的を学ぶ。\n2. 検索順位の仕組みの基礎に関する資料を学習する。", practiceTask: "1. SEO/MEO/ASOの各用語について、自分の言葉で正確に定義し、その違いを説明するレポートを作成する。", xp: 50 },
  { id: 14, category: "ソリューション設計・企画力", subCategory: "コンテンツマーケティング戦略の策定", skillName: "広告運用", priority: "小", objective: "広告配信プラットフォームの基本画面を操作できる。", inputTask: "1. 広告配信プラットフォームの役割、基本的な指標の定義を学ぶ。\n2. 配信プラットフォーム（例：Google Adsなど）の基本操作マニュアルを習得する。", practiceTask: "1. デモアカウントで、広告キャンペーンの作成画面まで進み、基本設定を完了する演習を行う。", xp: 50 },
  { id: 15, category: "ソリューション設計・企画力", subCategory: "KPI設定と効果測定", skillName: "KPI設定", priority: "中", objective: "顧客から指定されたKPI（例：「視聴回数1万回」）を正確に記録できる。", inputTask: "1. KPIの定義、KGIとの違い、目標を定量化する重要性を学ぶ。\n2. 目標設定シートのテンプレートを熟読する。", practiceTask: "1. 3件以上のプロジェクトの目標について、顧客から指定されたKPIを目標設定シートに正確に記録し、上長の確認を受ける。", xp: 100 },
  { id: 16, category: "ソリューション設計・企画力", subCategory: "KPI設定と効果測定", skillName: "データ分析ツール活用", priority: "小", objective: "YouTube Analyticsなど、基本的な分析ツールの画面を確認できる。", inputTask: "1. YouTube AnalyticsやGoogle Analyticsなど、基本的な分析ツールの画面構成と機能を学ぶ。\n2. 主要なレポートの場所と意味を理解する。", practiceTask: "1. 各ツール（YouTube Analyticsなど）の基本画面のスクリーンショットを撮り、各機能の名称を正確に記述した資料を作成する。", xp: 50 },
  { id: 17, category: "ソリューション設計・企画力", subCategory: "KPI設定と効果測定", skillName: "レポーティング", priority: "小", objective: "データの羅列ではなく、グラフなどを用いて分かりやすく資料をまとめられる。", inputTask: "1. データの羅列と分析結果の違い、グラフや図版を用いた視覚化の基本ルールを学ぶ。\n2. レポート作成の基本構成（結論→根拠）を習得する。", practiceTask: "1. 上長から提供されたデータから、グラフを3種類作成し、分かりやすいタイトルを付けて提出する。", xp: 50 },

  // 2. クリエイティブ・制作スキル
  { id: 18, category: "クリエイティブ・制作スキル", subCategory: "構成表・絵コンテ作成", skillName: "構成力", priority: "高", objective: "既存の台本や構成表に、修正箇所を正確に書き込める。", inputTask: "1. 既存の台本や構成表を読む練習、修正指示の一般的な書き方を学ぶ。\n2. 映像制作における起承転結、フックの概念を理解する。", practiceTask: "1. 過去の台本に対し、上長から口頭で指示された修正箇所を正確に書き込む演習を5回行う。", xp: 150 },
  { id: 19, category: "クリエイティブ・制作スキル", subCategory: "構成表・絵コンテ作成", skillName: "ビジュアライゼーション", priority: "高", objective: "顧客の指示に従い、簡単な絵コンテを清書できる。", inputTask: "1. 絵コンテの役割、描画ツールの基本操作（PowerPoint, Keynoteなど）を学ぶ。\n2. 簡単な図形や矢印を用いた指示の出し方を習得する。", practiceTask: "1. 顧客の指示（または上長の指示）に従い、簡単な絵コンテを清書し、画像として提出する演習を3回行う。", xp: 150 },
  { id: 20, category: "クリエイティブ・制作スキル", subCategory: "構成表・絵コンテ作成", skillName: "台本・ナレーション作成", priority: "高", objective: "既存の台本に修正箇所を正確に書き込める。", inputTask: "1. 台本の構成要素（ト書き、ナレーションなど）、修正指示の書き方を学ぶ。\n2. 映像と音声の連動に関する基礎知識を習得する。", practiceTask: "1. 既存の台本に対し、ナレーションの語尾や表現の修正箇所を正確に書き込む演習を5回行う。", xp: 150 },
  { id: 21, category: "クリエイティブ・制作スキル", subCategory: "映像表現・演出手法の知識", skillName: "映像文法", priority: "中", objective: "専門用語（例: \"バストショット\"、\"ロングショット\"）の意味を理解し、会話の中で使用できる。", inputTask: "1. 映像制作の専門用語（カット、ショットなど）の定義と、それぞれの効果を学ぶ。\n2. 実際の作品を見て、用語が使われている場面を特定する練習を行う。", practiceTask: "1. 専門用語を10個以上選定し、その定義と効果を説明するミニレポートを作成する。", xp: 100 },
  { id: 22, category: "クリエイティブ・制作スキル", subCategory: "映像表現・演出手法の知識", skillName: "演出提案", priority: "中", objective: "既存の作品を参考に、簡単な演出アイデアを提案できる。", inputTask: "1. 既存の作品を分析し、演出の種類を分類する練習を行う。\n2. 演出アイデアを発想するための思考法を学ぶ。", practiceTask: "1. 既存作品を5つ選定し、「このシーンに代わる簡単な演出アイデア」を1つずつ提案する。", xp: 100 },
  { id: 23, category: "クリエイティブ・制作スキル", subCategory: "映像表現・演出手法の知識", skillName: "音楽・効果音選定", priority: "中", objective: "既存のBGMライブラリから、指示された雰囲気の音楽を選べる。", inputTask: "1. BGMライブラリの操作方法、音楽の「雰囲気」を表す用語を学ぶ。\n2. 音響効果と感情の関係性に関する基礎知識を習得する。", practiceTask: "1. 上長から指示された雰囲気のBGMを3曲選定し、選定理由を文書で提出する演習を3回行う。", xp: 100 },
  { id: 24, category: "クリエイティブ・制作スキル", subCategory: "ライティングスキル", skillName: "コピーライティング", priority: "小", objective: "簡潔な言葉でメッセージを伝えることができる。", inputTask: "1. 簡潔に書くことの重要性、ターゲットに合わせたトーン&マナーの基本を学ぶ。\n2. コピーライティングの成功事例を分析する。", practiceTask: "1. 既存の長文テキストを「20文字以内」に要約する演習を10回行う。", xp: 50 },
  { id: 25, category: "クリエイティブ・制作スキル", subCategory: "ライティングスキル", skillName: "UXライティング", priority: "小", objective: "顧客の指示に従い、テロップやボタンのテキストを正確に記述できる。", inputTask: "1. UXライティングの目的、テロップやボタンのテキストが持つ役割を学ぶ。\n2. ユーザーを迷わせない言葉選びの基本ルールを習得する。", practiceTask: "1. 顧客の指示に従い、Webサイトのボタンやメッセージのテキストを正確に記述し、上長の確認を受ける。", xp: 50 },
  { id: 26, category: "クリエイティブ・制作スキル", subCategory: "撮影・編集技術の理解", skillName: "撮影指示", priority: "中", objective: "撮影現場で、監督の指示に従い、カメラアングルや構図を調整できる。", inputTask: "1. カメラアングルや構図の基本、撮影現場での立ち居振る舞いを学ぶ。\n2. 撮影機材の基本操作に関するマニュアルを熟読する。", practiceTask: "1. 撮影現場に同行し、監督の指示を正確に理解し、カメラアングルや構図を調整する演習を3回行う。", xp: 100 },
  { id: 27, category: "クリエイティブ・制作スキル", subCategory: "撮影・編集技術の理解", skillName: "編集指示", priority: "中", objective: "編集者から指示された部分の映像素材を正確に探せる。", inputTask: "1. 映像素材のフォルダ構造、編集ソフトの基本画面と機能を学ぶ。\n2. 編集者からの指示（例: タイムコード）を正確に理解する方法を習得する。", practiceTask: "1. 編集者からの指示に従い、特定のシーンや素材をフォルダ内から正確に探し出す演習を5回行う。", xp: 100 },

  // 3. 顧客折衝・コミュニケーション
  { id: 28, category: "顧客折衝・コミュニケーション", subCategory: "プレゼンテーション能力", skillName: "資料作成", priority: "中", objective: "プレゼン資料の誤字脱字チェックや、指定された図版の挿入作業を行える。", inputTask: "1. プレゼン資料の基本ルール（フォント、配色、レイアウト）を学ぶ。\n2. 誤字脱字チェックリストを作成する。", practiceTask: "1. 上長が作成したプレゼン資料の誤字脱字チェックを完璧に行う（3回）。\n2. 指定された図版を正確に挿入し、レイアウトを整える演習を行う。", xp: 100 },
  { id: 29, category: "顧客折衝・コミュニケーション", subCategory: "プレゼンテーション能力", skillName: "説明力", priority: "高", objective: "プレゼン資料の内容を読み上げ、正確に伝えることができる。", inputTask: "1. プレゼン資料の読み方、正しい発声と発音に関する資料を学習する。\n2. 落ち着いた話し方、ボディーランゲージの基本を習得する。", practiceTask: "1. 上長の前でプレゼン資料の内容を正確に読み上げるロールプレイングを3回行う。", xp: 150 },
  { id: 30, category: "顧客折衝・コミュニケーション", subCategory: "プレゼンテーション能力", skillName: "質疑応答", priority: "高", objective: "顧客からの質問を正確にメモし、担当者へ報告できる。", inputTask: "1. 顧客からの質問を正確にメモする方法、質問を分類する練習を行う。\n2. 想定問答集の作成方法を学ぶ。", practiceTask: "1. 打ち合わせに同席し、顧客からの質問をすべてメモし、担当者へ正確に口頭報告する。", xp: 150 },
  { id: 31, category: "顧客折衝・コミュニケーション", subCategory: "交渉・調整能力", skillName: "要件整理", priority: "高", objective: "顧客の要望を正確にメモし、担当者へ報告できる。", inputTask: "1. 顧客の要望を正確にメモする方法、メモの内容を分かりやすく整理する手法を学ぶ。\n2. 顧客の要望をMUST/WANTで分類する練習を行う。", practiceTask: "1. 打ち合わせに同席し、顧客の要望をすべてメモし、担当者へ正確に文書で報告する。", xp: 150 },
  { id: 32, category: "顧客折衝・コミュニケーション", subCategory: "交渉・調整能力", skillName: "落とし所", priority: "中", objective: "顧客の要望と制作予算・スケジュールのバランスを考慮し、現実的な落とし所を提案できる。", inputTask: "1. 制作における基本的な予算・スケジュール構成を学ぶ。\n2. 交渉の基本（MUST/WANT）を習得する。", practiceTask: "1. 予算とスケジュールが逼迫したケースを想定し、現実的な落とし所を上長に提案する演習を行う。", xp: 100 },
  { id: 33, category: "顧客折衝・コミュニケーション", subCategory: "フィードバックのヒアリング・理解", skillName: "本質理解", priority: "高", objective: "顧客のフィードバックを正確に記録できる。", inputTask: "1. フィードバックの正確な記録方法、フィードバックの意図を深掘りする傾聴技術を学ぶ。\n2. 感情コントロールの基礎を習得する。", practiceTask: "1. 顧客からネガティブなFBを受けた際、フィードバック内容をすべて正確に記録し、上長へ報告する。", xp: 150 },
  { id: 34, category: "顧客折衝・コミュニケーション", subCategory: "フィードバックのヒアリング・理解", skillName: "建設的対話", priority: "高", objective: "顧客のフィードバックに対して、感謝の意を述べることができる。", inputTask: "1. 顧客とのコミュニケーションにおける基本的なマナー、感謝の意を伝える重要性を学ぶ。\n2. ポジティブな言葉遣いの練習を行う。", practiceTask: "1. 顧客のフィードバックに対し、感謝の意を述べると共に、次のアクションを簡潔に確認するロールプレイングを行う。", xp: 150 },
  { id: 35, category: "顧客折衝・コミュニケーション", subCategory: "チーム内・社内連携", skillName: "情報共有", priority: "中", objective: "顧客からの情報をチームメンバーに正確に共有できる。", inputTask: "1. 顧客からの情報をチーム内で共有するためのツールと手順を学ぶ。\n2. 重要な情報をタイムリーに伝える重要性を理解する。", practiceTask: "1. 顧客との連絡事項を指定されたツール（例：Slack, Teams）で正確に共有する演習を5回行う。", xp: 100 },
  { id: 36, category: "顧客折衝・コミュニケーション", subCategory: "チーム内・社内連携", skillName: "協力体制", priority: "中", objective: "他部署のメンバーと協力し、業務を円滑に進められる。", inputTask: "1. 他部署のメンバーの役割と連絡先を把握する。\n2. 業務を依頼する際の基本的なマナーと依頼文書の書き方を学ぶ。", practiceTask: "1. 他部署のメンバーに業務を円滑に依頼し、その後の進捗確認まで行う演習を3回行う。", xp: 100 },

  // 4. プロジェクトマネジメント・遂行力
  { id: 37, category: "プロジェクトマネジメント・遂行力", subCategory: "スケジュール・予算管理", skillName: "計画立案", priority: "中", objective: "無理のない現実的なスケジュールと予算を立てることができる。", inputTask: "1. スケジュールと予算の基本的な構成要素を学ぶ。\n2. 現実的な目標設定の重要性とタスクの見積もり方法を習得する。", practiceTask: "1. 簡単な企画について、無理のない現実的なスケジュールと予算の初案を立てて提出する。", xp: 100 },
  { id: 38, category: "プロジェクトマネジメント・遂行力", subCategory: "スケジュール・予算管理", skillName: "進捗管理", priority: "中", objective: "タスクの進捗状況を常に把握し、報告できる。", inputTask: "1. タスクの進捗状況を正確に把握する方法、報告のタイミングと内容を学ぶ。\n2. 進捗管理ツールの基本的な使い方を習得する。", practiceTask: "1. 担当タスクの進捗状況を毎日正確に把握し、週次報告書に反映させる。", xp: 100 },
  { id: 39, category: "プロジェクトマネジメント・遂行力", subCategory: "スケジュール・予算管理", skillName: "リスク管理", priority: "中", objective: "潜在的な課題を事前に特定し、対策を講じることができる。", inputTask: "1. プロジェクトにおける一般的なリスクの種類、リスクを事前に特定する方法を学ぶ。\n2. リスクの影響度と発生確率を評価する基本手法を習得する。", practiceTask: "1. 担当プロジェクトのリスクを3つ以上特定し、上長から指示された対応策をマニュアル通りに講じる演習を行う。", xp: 100 },
  { id: 40, category: "プロジェクトマネジメント・遂行力", subCategory: "品質管理・チェック", skillName: "品質基準設定", priority: "中", objective: "成果物の品質に関する基準を明確にできる。", inputTask: "1. 成果物の品質に関する基本的な基準、要件定義書と品質基準の関係を学ぶ。\n2. 品質基準を明確にするためのチェックリストの作り方を学ぶ。", practiceTask: "1. 既存の要件定義書を基に、成果物の品質基準チェックリストを作成する。", xp: 100 },
  { id: 41, category: "プロジェクトマネジメント・遂行力", subCategory: "品質管理・チェック", skillName: "レビュー", priority: "中", objective: "制作物の最終確認を行い、ミスや不備をなくせる。", inputTask: "1. 制作物の最終確認の重要性、ミスや不備をなくすためのチェックリストの作り方を学ぶ。\n2. レビューの基本手順を習得する。", practiceTask: "1. 制作物の最終確認を行い、ミスや不備を指摘する演習を3回行う。", xp: 100 },
  { id: 42, category: "プロジェクトマネジメント・遂行力", subCategory: "納品・公開プロセスの管理", skillName: "納品形式", priority: "小", objective: "顧客の要望に合わせた最適な形式で納品できる。", inputTask: "1. 納品形式の種類（mp4, Movなど）と、それぞれのメリット・デメリットを学ぶ。\n2. 顧客の配信環境（YouTube, Webサイトなど）に合わせた最適な形式を選ぶ基準を学ぶ。", practiceTask: "1. 顧客の要望に合わせた最適な納品形式を提案し、その理由を説明する。", xp: 50 },
  { id: 43, category: "プロジェクトマネジメント・遂行力", subCategory: "納品・公開プロセスの管理", skillName: "公開支援", priority: "中", objective: "コンテンツの公開プロセスをサポートできる。", inputTask: "1. コンテンツの公開プロセス、公開後のチェック項目を学ぶ。\n2. 配信プラットフォームへのアップロード手順を習得する。", practiceTask: "1. コンテンツの公開プロセスをサポートし、公開後のチェック項目をすべて確認する。", xp: 100 },
  { id: 44, category: "プロジェクトマネジメント・遂行力", subCategory: "プロジェクトの引継ぎ・ナレッジ共有", skillName: "ドキュメント作成", priority: "小", objective: "プロジェクトの経緯や成果をドキュメントにまとめられる。", inputTask: "1. プロジェクトの経緯や成果をドキュメントにまとめる方法、分かりやすい構成を学ぶ。\n2. ドキュメント作成ツールの基本的な操作を習得する。", practiceTask: "1. 完了したプロジェクトを対象に、経緯や成果をドキュメントにまとめる。", xp: 50 },
  { id: 45, category: "プロジェクトマネジメント・遂行力", subCategory: "プロジェクトの引継ぎ・ナレッジ共有", skillName: "ノウハウ共有", priority: "中", objective: "自分の業務を通じて得た学びや気づきを、チームに共有できる。", inputTask: "1. 業務を通じて得た学びを整理する方法、チームメンバーに共有するメリットを学ぶ。\n2. 成功・失敗事例の分析手法を学ぶ。", practiceTask: "1. 自分の業務を通じて得た学びや気づきを、チームに共有する演習を3回行う。", xp: 100 }
];

const CATEGORIES = {
  "ソリューション設計・企画力": {
    color: "text-blue-500", bgColor: "bg-blue-500", bgLight: "bg-blue-50",
    border: "border-blue-200", icon: "brain-circuit", description: "STRATEGY"
  },
  "クリエイティブ・制作スキル": {
    color: "text-rose-500", bgColor: "bg-rose-500", bgLight: "bg-rose-50",
    border: "border-rose-200", icon: "zap", description: "CREATIVITY"
  },
  "顧客折衝・コミュニケーション": {
    color: "text-emerald-500", bgColor: "bg-emerald-500", bgLight: "bg-emerald-50",
    border: "border-emerald-200", icon: "users", description: "CHARISMA"
  },
  "プロジェクトマネジメント・遂行力": {
    color: "text-violet-500", bgColor: "bg-violet-500", bgLight: "bg-violet-50",
    border: "border-violet-200", icon: "shield-check", description: "MANAGEMENT"
  }
};

// バッジ定義
const BADGES = [
  { id: 'strategy_half', name: '戦略の見習い', description: 'STRATEGY 50%達成', category: 'ソリューション設計・企画力', threshold: 0.5, icon: '🗺️' },
  { id: 'strategy_master', name: '戦略マスター', description: 'STRATEGY 全クリア', category: 'ソリューション設計・企画力', threshold: 1.0, icon: '🧠' },
  { id: 'creative_half', name: 'クリエイター見習い', description: 'CREATIVITY 50%達成', category: 'クリエイティブ・制作スキル', threshold: 0.5, icon: '🎨' },
  { id: 'creative_master', name: 'クリエイティブマスター', description: 'CREATIVITY 全クリア', category: 'クリエイティブ・制作スキル', threshold: 1.0, icon: '⚡' },
  { id: 'charisma_half', name: '交渉人見習い', description: 'CHARISMA 50%達成', category: '顧客折衝・コミュニケーション', threshold: 0.5, icon: '🤝' },
  { id: 'charisma_master', name: 'カリスママスター', description: 'CHARISMA 全クリア', category: '顧客折衝・コミュニケーション', threshold: 1.0, icon: '👑' },
  { id: 'management_half', name: 'PM見習い', description: 'MANAGEMENT 50%達成', category: 'プロジェクトマネジメント・遂行力', threshold: 0.5, icon: '📋' },
  { id: 'management_master', name: 'PMマスター', description: 'MANAGEMENT 全クリア', category: 'プロジェクトマネジメント・遂行力', threshold: 1.0, icon: '🛡️' },
  { id: 'legend', name: '伝説のディレクター', description: '全スキル制覇', category: null, threshold: 1.0, icon: '🏆' }
];
