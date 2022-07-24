import React, {useState, useContext, useEffect} from "react";
import {Routes, Route, Link, useParams, useLocation, useNavigate} from "react-router-dom";
const clone = require("rfdc")();

const dayName = ["日", "月", "火", "水", "木", "金", "土"];

const BoardsContext = React.createContext();
const ErrorContext = React.createContext();

let boardsToken;

function App() {
  const [error, updateError] = useState("");
  const navigate = useNavigate();
  let navigateTo;
  useEffect(() => {
    if (navigateTo || navigateTo === "") {
      navigate(navigateTo);
    }
  }, [navigateTo]);

  const params = new URLSearchParams(window.location.search);
  switch (params.get("action")) {
    case "login":
      localStorage.setItem("id", params.get("id"));
      localStorage.setItem("screen_name", params.get("screen_name"));
      localStorage.setItem("user_token", params.get("user_token"));
      navigateTo = "";
      break;
  }
  
  return (
    <ErrorContext.Provider value={{error, updateError}}>
      <Routes>
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<Private />} />
      </Routes>
      <Error />
    </ErrorContext.Provider>
  );
}
function Private() {
  const {error, updateError} = useContext(ErrorContext);
  const [boards, updateBoards] = useState();
  const [savedBoards, updateSavedBoards] = useState();
  const navigate = useNavigate();
  let navigateTo;
  useEffect(() => {
    if (navigateTo || navigateTo === "") {
      navigate(navigateTo);
    }
  }, [navigateTo]);

  if (!localStorage.getItem("id") || !localStorage.getItem("user_token")) {
    navigateTo = "/login";
  }

  useEffect(() => {
    if (localStorage.getItem("id") && localStorage.getItem("user_token")) {
      boardsToken = null;
      const formData = new FormData();
      formData.set("id", localStorage.getItem("id"));
      formData.set("user_token", localStorage.getItem("user_token"));
      fetch("/account/connect.php", {
            method: "POST",
            cache: "no-cache",
            body: formData
        })
        .then((response) => {
          if (!response.ok) {
            throw new Error(response.status + response.statusText);
          }
          return response.json();
        })
        .then((response) => {
          if (response.error) {
            switch (response.error) {
              case "invalid token":
              case "unknown user":
              case "lack of parameters":
                localStorage.clear();
                updateError("再ログインが必要です");
                break;
              default:
                throw new Error(response.error);
            }
          } else {
            updateBoards(response.boards);
            boardsToken = response.boards_token;
          }
        })
        .catch((error) => {
          updateError("サーバーへの接続に失敗しました");
          console.log(error);
        });
    }
  }, []);
  
  const uploadBoards = () => {
    if (localStorage.getItem("id") && boards && boardsToken) {
      const formData = new FormData();
      formData.set("id", localStorage.getItem("id"));
      formData.set("boards_token", boardsToken);
      formData.set("boards", JSON.stringify(boards));
      boardsToken = null;
      fetch("/account/update.php", {
          method: "POST",
          cache: "no-cache",
          body: formData
        })
        .then((response) => {
          if (!response.ok) {
            throw new Error(response.status + response.statusText);
          }
          return response.json();
        })
        .then((response) => {
          if (response.error) {
            switch (response.error) {
              case "invalid token":
                updateError("サーバーとの接続が切断されました");
                break;
              case "unknown user":
                localStorage.clear();
                updateError("再ログインが必要です");
                break;
              case "lack of parameters":
                updateError("不明なエラーが発生しました");
                break;
              default:
                throw new Error(response.error);
            }
          } else {
            boardsToken = response.boards_token;
            updateSavedBoards(response.boards);
          }
        })
        .catch((error) => {
          updateError("サーバーへの接続に失敗しました");
          console.log(error);
        });
    }
  };
  useEffect(uploadBoards, [boards]);

  useEffect(() => {
    if (boards && savedBoards) {
      if (!(Object.keys(boards).length == 0 && Object.keys(savedBoards).length == 0) && JSON.stringify(boards) != JSON.stringify(savedBoards)) {
        uploadBoards();
      }
    }
  }, [savedBoards]);

  if (boards) {
    return (
      <BoardsContext.Provider value={{boards, updateBoards}}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/board/:boardId" element={<Board />} />
          <Route path="/setting" element={<Setting />} />
          <Route path="/account" element={<Account />} />
          <Route path="/delete" element={<DeleteAccount />} />
        </Routes>  
      </BoardsContext.Provider>
    );
  } else {
    return <Splash />;
  }
}

function Home() {
  document.title = "すべてのタスク - Tidy";
  return (
    <div id="base">
      <Header />
      <Dashboard />
      <Menu />
      <Popup />
    </div>
  );
}
function Setting() {
  document.title = "設定 - Tidy";
  return (
    <div id="base">
      <Header />
      <div className="body with-menu">
        <div className="column">
          <Title content="設定" />
          <div className="setting-group">
            <Link to="/account" className="button">
              <Entry title="アカウント" state={"@" + localStorage.getItem("screen_name")} />
            </Link>
          </div>
          <div className="setting-group">
            <Link to="/terms" className="button">
              <Entry title="利用規約" />
            </Link>
            <Link to="/privacy" className="button">
              <Entry title="プライバシーポリシー" />
            </Link>
          </div>
        </div>
      </div>
      <Menu />
    </div>
  );
}
function Login() {
  document.title = "ログイン - Tidy";
  return (
    <div id="base">
      <Header public />
      <div className="body">
        <div className="column">
          <Title content="Twitter でログイン" />
          <p>Tidy ではデータの同期に Twitter アカウントを使用します。</p>
          <p>データの取り扱いについてはこちら。<br />
          <Link to="/terms" className="link">利用規約</Link><br />
          <Link to="/privacy" className="link">プライバシーポリシー</Link></p>
          <a href="/account/redirect.php" className="button large-button">Twitter でログイン</a>
        </div>
      </div>
    </div>
  );
}
function Account() {
  document.title = "@" + localStorage.getItem("screen_name") + " - Tidy";
  const {boards, updateBoards} = useContext(BoardsContext);
  const {error, updateError} = useContext(ErrorContext);
  const [exportedUrl, updateExportedUrl] = useState("");
  const navigate = useNavigate();

  const exportBoards = () => {
    var blob = new Blob([JSON.stringify(boards)], {type: "application/json"});
    updateExportedUrl(window.URL.createObjectURL(blob));
  };
  const logout = () => {
    localStorage.clear();
  };
  const logoutAll = (e) => {
    e.preventDefault();
    if (localStorage.getItem("id") && localStorage.getItem("user_token")) {
      const formData = new FormData();
      formData.set("id", localStorage.getItem("id"));
      formData.set("user_token", localStorage.getItem("user_token"));
      fetch("/account/logoutall.php", {
            method: "POST",
            cache: "no-cache",
            body: formData
        })
        .then((response) => {
          if (!response.ok) {
            throw new Error(response.status + response.statusText);
          }
          return response.json();
        })
        .then((response) => {
          if (response.error) {
            switch (response.error) {
              case "invalid token":
              case "unknown user":
              case "lack of parameters":
                localStorage.clear();
                updateError("再ログインが必要です");
                break;
              default:
                throw new Error(response.error);
            }
          } else {
            localStorage.clear();
            navigate("/login");
          }
        })
        .catch((error) => {
          updateError("サーバーへの接続に失敗しました");
          console.log(error);
        });
    }
  };

  return (
    <div id="base">
      <Header />
      <div className="body with-menu">
        <div className="column">
          <Title content={"@" + localStorage.getItem("screen_name")} />
          <div className="setting-group">
            <Link to="/login" className="button">
              <Entry title="他のアカウントでログイン" />
            </Link>
            <a onClick={exportBoards} href={exportedUrl} download="exported.json" className="button">
              <Entry title="データをエクスポート" />
            </a>
          </div>
          <div className="setting-group">
            <Link onClick={logout} to="/login" className="button">
              <Entry title="ログアウト" />
            </Link>
            <a onClick={logoutAll} href="" className="button">
              <Entry title="すべての端末でログアウト" />
            </a>
            <Link to="/delete" className="button">
              <Entry title="アカウントを削除" />
            </Link>
          </div>
        </div>
      </div>
      <Menu />
    </div>
  );
}
function DeleteAccount() {
  document.title = "アカウントを削除 - Tidy";
  const {error, updateError} = useContext(ErrorContext);
  const navigate = useNavigate();

  const deleteAccount = (e) => {
    e.preventDefault();
    if (localStorage.getItem("id") && localStorage.getItem("user_token")) {
      const formData = new FormData();
      formData.set("id", localStorage.getItem("id"));
      formData.set("user_token", localStorage.getItem("user_token"));
      fetch("/account/delete.php", {
            method: "POST",
            cache: "no-cache",
            body: formData
        })
        .then((response) => {
          if (!response.ok) {
            throw new Error(response.status + response.statusText);
          }
          return response.json();
        })
        .then((response) => {
          if (response.error) {
            switch (response.error) {
              case "invalid token":
              case "unknown user":
              case "lack of parameters":
                localStorage.clear();
                updateError("再ログインが必要です");
                break;
              default:
                throw new Error(response.error);
            }
          } else {
            localStorage.clear();
            navigate("/login");
          }
        })
        .catch((error) => {
          updateError("サーバーへの接続に失敗しました");
          console.log(error);
        });
    }
  };

  return (
    <div id="base">
      <Header />
      <div className="body with-menu">
        <div className="column">
          <Title content="アカウントを削除" />
          <p>この操作は取り消せません。続行しますか？</p>
          <div className="setting-group">
            <a onClick={deleteAccount} href="" className="button">
              <Entry title="続行" />
            </a>
          </div>
        </div>
      </div>
      <Menu />
    </div>
  );
}
function Terms() {
  document.title = "利用規約 - Tidy";
  return (
    <div id="base">
      <Header public />
      <div className="body">
        <div className="column">
          <Title content="利用規約" />
          <p>この利用規約（以下，「本規約」といいます。）は，Diawel（以下，「作者」といいます。）がこのウェブサイト上で提供するサービス（以下，「本サービス」といいます。）の利用条件を定めるものです。
          利用者の皆さま（以下，「ユーザー」といいます。）には，本規約に従って，本サービスをご利用いただきます。</p>
          <h3>第1条（適用）</h3>
          <ol>
            <li>本規約は，ユーザーと作者との間の本サービスの利用に関わる一切の関係に適用されるものとします。</li>
            <li>作者は本サービスに関し，本規約のほか，ご利用にあたってのルール等，各種の定め（以下，「個別規定」といいます。）をすることがあります。
              これら個別規定はその名称のいかんに関わらず，本規約の一部を構成するものとします。</li>
            <li>本規約の規定が前条の個別規定の規定と矛盾する場合には，個別規定において特段の定めなき限り，個別規定の規定が優先されるものとします。</li>
          </ol>
          <h3>第2条（禁止事項）</h3>
          ユーザーは，本サービスの利用にあたり，以下の行為をしてはなりません。
          <ol>
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>本サービスの内容等，本サービスに含まれる著作権，商標権ほか知的財産権を侵害する行為</li>
            <li>作者，ほかのユーザー，またはその他第三者のサーバーまたはネットワークの機能を破壊したり，妨害したりする行為</li>
            <li>作者のサービスの運営を妨害するおそれのある行為</li>
            <li>不正アクセスをし，またはこれを試みる行為</li>
            <li>不正な目的を持って本サービスを利用する行為</li>
            <li>本サービスの他のユーザーまたはその他の第三者に不利益，損害，不快感を与える行為</li>
            <li>作者のサービスに関連して，反社会的勢力に対して直接または間接に利益を供与する行為</li>
            <li>その他，作者が不適切と判断する行為</li>
          </ol>
          <h3>第3条（本サービスの提供の停止等）</h3>
          <ol>
            <li>作者は，ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。</li>
            <li>作者は，本サービスの提供の停止または中断により，ユーザーまたは第三者が被ったいかなる不利益または損害についても，一切の責任を負わないものとします。</li>
          </ol>
          <h3>第4条（利用制限）</h3>
          <ol>
            <li>作者は，ユーザーが本規約のいずれかの条項に違反した場合など，本サービスの利用を適当でないと判断した場合には，
              事前の通知なく，ユーザーに対して，本サービスの全部もしくは一部の利用を制限することができるものとします。</li>
            <li>作者は，本条に基づき作者が行った行為によりユーザーに生じた損害について，一切の責任を負いません。</li>
          </ol>
          <h3>第5条（保証の否認および免責事項）</h3>
          <ol>
            <li>作者は，本サービスに事実上または法律上の瑕疵（安全性，信頼性，正確性，完全性，有効性，特定の目的への適合性，セキュリティなどに関する欠陥，エラーやバグ，権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。</li>
            <li>作者は，本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。ただし，本サービスに関する作者とユーザーとの間の契約（本規約を含みます。）が消費者契約法に定める消費者契約となる場合，この免責規定は適用されません。</li>
            <li>作者は，本サービスに関して，ユーザーと他のユーザーまたは第三者との間において生じた取引，連絡または紛争等について一切責任を負いません。</li>
          </ol>
          <h3>第6条（サービス内容の変更等）</h3>
          作者は，ユーザーに通知することなく，本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし，これによってユーザーに生じた損害について一切の責任を負いません。
          <h3>第7条（利用規約の変更）</h3>
          作者は，必要と判断した場合には，ユーザーに通知することなくいつでも本規約を変更することができるものとします。なお，本規約の変更後，本サービスの利用を開始した場合には，当該ユーザーは変更後の規約に同意したものとみなします
          <h3>第8条（準拠法・裁判管轄）</h3>
          本規約の解釈にあたっては，日本法を準拠法とします。
          <p>以上</p>
        </div>
      </div>
    </div>
  );
}
function Privacy() {
  document.title = "プライバシーポリシー - Tidy";
  return (
    <div id="base">
      <Header public />
      <div className="body">
        <div className="column">
          <Title content="プライバシーポリシー" />
          <p>Diawel（以下，「作者」といいます。）は，本ウェブサイト上で提供するサービス（以下,「本サービス」といいます。）における，利用者の皆さま（以下，「ユーザー」といいます。）の個人情報の取扱いについて，以下のとおりプライバシーポリシー（以下，「本ポリシー」といいます。）を定めます。</p>
          <h3>第1条（個人情報の収集）</h3>
          <ol>
            <li>作者は，ユーザーに関する，IPアドレスなどの個人を特定することにつながるデータを収集することがあります。</li>
            <li>作者は，本サービスで収集したいかなるデータも，連動する外部のサービスに送信することがあります。</li>
          </ol>
          <h3>第2条（個人情報を収集・利用する目的）</h3>
          <p>作者が個人情報を収集・利用する目的は，以下のとおりです。</p>
          <ol>
            <li>サービスの提供・運営のため</li>
            <li>利用規約に違反したユーザーや，不正・不当な目的でサービスを利用しようとするユーザーの特定をし，ご利用をお断りするため</li>
            <li>上記の利用目的に付随する目的</li>
          </ol>
          <h3>第3条（利用目的の変更）</h3>
          <p>作者は，利用目的が変更前と関連性を有すると合理的に認められる場合に限り，個人情報の利用目的を変更するものとします。</p>
          <h3>第4条（プライバシーポリシーの変更）</h3>
          <ol>
            <li>本ポリシーの内容は，法令その他本ポリシーに別段の定めのある事項を除いて，ユーザーに通知することなく，変更することができるものとします。</li>
            <li>作者が別途定める場合を除いて，変更後のプライバシーポリシーは，本ウェブサイトに掲載したときから効力を生じるものとします。</li>
          </ol>
          <p>以上</p>
        </div>
      </div>
    </div>
  );
}

function Header(props) {
  return (
    <div className={props.public ? "header": "header with-menu"}>
      <a href="/">
        <img className="logo-main" src="/img/logo.svg" />
      </a>
      <a href="#menu">
        <img className="menu-btn" src="/img/menu.svg" />
      </a>
    </div>
  );
}
function Menu() {
  const {boards, updateBoards} = useContext(BoardsContext);
  const hash = useLocation().hash.substring(1);
  const addBoard = (e) => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let uid = "u";
    for ( var i = 0; i < 11; i++ ) {
      uid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    let updatedBoards = Object.keys(boards).length ? clone(boards) : {};
    updatedBoards[uid] = {
      profile: {
        timestamp: new Date().toISOString(),
        title: "新規ボード",
        color: 0,
        onDashboard: true
      },
      task: []
    };
    updateBoards(updatedBoards);
    e.target.href = "#" + uid;
  };
  let boardList = [];
  for (let board in boards) {
    boardList.push([board, boards[board]]);
  }
  boardList.sort((first, second) => {
    if (first[1].profile.timestamp.replace(/[^0-9]/g, "") < second[1].profile.timestamp.replace(/[^0-9]/g, "")) return 1;
    if (first[1].profile.timestamp.replace(/[^0-9]/g, "") > second[1].profile.timestamp.replace(/[^0-9]/g, "")) return -1;
    return 0;
  });
  return (
    <div className="menu" state={hash == "menu" ? "show" : "hide"}>
      <div className="header">
        <a href="/">
          <img className="logo-menu" src="/img/logo.svg" />
        </a>
        <Link to="">
          <img className="close" src="/img/close.svg" />
        </Link>
      </div>
      <div className="body">
        <Link to="/" className="all button">
          すべてのタスク
        </Link>
        <h2>進行中のボード</h2>
        {
          boardList.map((board) => {
            return (
              <Link key={board} to={"/board/" + board[0]} className="board button" color={board[1].profile.color}>
                {board[1].profile.title}
              </Link>
            )
          })
        }
        <a className="add button" href="" onClick={addBoard}>
          ボードを追加
        </a>
      </div>
      <div className="footer">
        <Link className="button" to="/setting">
          <img className="setting-btn" src="/img/setting.svg" />
        </Link>
      </div>
    </div>
  );
}
function Error() {
  const {error, updateError} = useContext(ErrorContext);
  if (error) {
    return (
      <div className="dialog-box error">
        <div className="dialog error">
          {error}
          <div className="control">
            <a href="">
              再読み込み
            </a>
          </div>
        </div>
      </div>
    );
  }
}
function Splash() {
  return (
    <div className="splash">
      <img src="/logo512.png" />
    </div>
  );
}

function Entry(props) {
  return (
    <div className="item-box">
      <div className="item">
        <div className="name">
          {props.title}
        </div>
        <div className="state">
          {props.state}
        </div>
      </div>
    </div>
  );
}

function TaskTitle(props) {
  const updateTitle = (e) => {
    let updatedTask = clone(props.task);
    updatedTask.title = e.target.value;
    props.updateTask(updatedTask);
  };
  return (
    <input className="title" type="text" placeholder="タスク名を入力" value={props.task.title} onChange={updateTitle} />
  );
}
function Schedule(props) {
  const [editing, updateEditing] = useState(false);
  const [scheduleText, updateScheduleText] = useState("");
  const textInput = React.createRef();
  let schedule = "";
  let scheduled;
  useEffect(() => {
    if (editing) {
      textInput.current.focus();
      textInput.current.select();
    }
  }, [editing]);
  if (editing) {
    const updateSchedule = (e) => {
      let updatedTask = clone(props.task);
      if (scheduleText) {
        const timestamp = Date.parse(scheduleText);
        if (!isNaN(timestamp)) {
          updatedTask.schedule = new Date(timestamp).toISOString();
          props.updateTask(updatedTask);
        }
      } else {
        updatedTask.schedule = null;
        props.updateTask(updatedTask);
      }
      updateEditing(false);
    };
    const onChange = (e) => {
      updateScheduleText(e.target.value);
    };
    const quit = (e) => {
      if (e.keyCode == 13) {
        e.target.blur();
      }
    }
    return (
      <input className="schedule editing" ref={textInput} type="text" value={scheduleText} onChange={onChange} onBlur={updateSchedule} onKeyDown={quit} />
    );
  } else {
    const edit = (e) => {
      e.preventDefault();
      let date;
      if (props.task.schedule) date = new Date(props.task.schedule);
      else date = new Date();
      updateScheduleText(date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + (date.getDate()) + " " + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0"));
      updateEditing(true);
    };
    if (props.task.schedule) {
      const now = new Date();
      const taskDate = new Date(props.task.schedule);
      if (now.getFullYear() == taskDate.getFullYear()) {
        schedule = (taskDate.getMonth() + 1) + "月" + (taskDate.getDate()) + "日 " + String(taskDate.getHours()).padStart(2, "0") + ":" + String(taskDate.getMinutes()).padStart(2, "0");
      } else {
        schedule = taskDate.getFullYear() + "年" + (taskDate.getMonth() + 1) + "月" + (taskDate.getDate()) + "日 " + String(taskDate.getHours()).padStart(2, "0") + ":" + String(taskDate.getMinutes()).padStart(2, "0");
      }
      scheduled = true;
    } else {
      schedule = "日時を設定";
      scheduled = false;
    }
    return (
      <a href="" className={scheduled ? "schedule" : "schedule unset"} onClick={edit}>
        {schedule}
      </a>
    );
  }
}
function Repeat(props) {
  if (props.task.schedule) {
    const updateRepeat = (e) => {
      e.preventDefault();
      let updatedTask = clone(props.task);
      updatedTask.repeat = props.task.repeat + 1;
      if (updatedTask.repeat == 3) updatedTask.repeat = 0;
      props.updateTask(updatedTask);
    };
    let text;
    switch (props.task.repeat) {
      case 0:
        text = "繰り返しなし";
        break;
      case 1:
        text = "繰り返し (毎週)";
        break;
      case 2:
        text = "繰り返し (毎日)";
        break;
    }
    return (
      <a href="" className="repeat button" onClick={updateRepeat}>
        {text}
      </a>
    );
  }
}
function Description(props) {
  const updateDescription = (e) => {
    let updatedTask = clone(props.task);
    updatedTask.description = e.target.value;
    props.updateTask(updatedTask);
  };
  return (
    <textarea className="description" placeholder="説明を入力" onChange={updateDescription}>{props.task.description}</textarea>
  );
}
function BoardTitle(props) {
  const updateTitle = (e) => {
    let updatedBoard = clone(props.board);
    updatedBoard.profile.title = e.target.value;
    props.updateBoard(updatedBoard);
  };
  return (
    <input className="title" type="text" placeholder="ボード名を入力" value={props.board.profile.title} onChange={updateTitle} />
  );
}
function BoardColor(props) {
  const [editing, updateEditing] = useState(false);
  if (editing) {
    const quit = (e) => {
      e.preventDefault();
      updateEditing(false);
    };
    const updateColor = (e) => {
      e.preventDefault();
      let updatedBoard = clone(props.board);
      updatedBoard.profile.color = parseInt(e.currentTarget.getAttribute("color"), 10);
      props.updateBoard(updatedBoard);
    };
    return (
      <div>
        <a href="" className="color" color={props.board.profile.color} onClick={quit}>
          テーマカラー
        </a>
        <div className="colors">
          {[...Array(9)].map((_, i) => {
            return <a href="" key={i} color={i} onClick={updateColor} className={props.board.profile.color == i ? "selected" : ""}></a>
          })}
        </div>
      </div>
    );
  } else {
    const edit = (e) => {
      e.preventDefault();
      updateEditing(true);
    };
    return (
      <a href="" className="color" color={props.board.profile.color} onClick={edit}>
        テーマカラー
      </a>
    );
  }
}
function OnDashboard(props) {
  const updateOnDashboard = (e) => {
    e.preventDefault();
    let updatedBoard = clone(props.board);
    updatedBoard.profile.onDashboard = !props.board.profile.onDashboard;
    props.updateBoard(updatedBoard);
  };
  return (
    <a className="switch" href="" state={props.board.profile.onDashboard ? "on" : "off"} onClick={updateOnDashboard}>
      「すべてのタスク」に表示する
      <img src={props.board.profile.onDashboard ? "/img/on.svg" : "/img/off.svg"} />
    </a>
  )
}
function Popup() {
  const {boards, updateBoards} = useContext(BoardsContext);
  const navigate = useNavigate();
  const hash = useLocation().hash.substring(1);
  let navigateTo;
  useEffect(() => {
    if (navigateTo || navigateTo === "") {
      navigate(navigateTo);
    }
  }, [navigateTo]);

  if (hash.match(/(\d|[a-z]|[A-Z]){12}\.\d+/)) {
    let pointer = hash.split(".");
    if (boards[pointer[0]] && boards[pointer[0]].task[pointer[1]]) {
      return (
        <TaskDialog board={pointer[0]} task={pointer[1]} />
      );
    } else {
      navigateTo = "";
    }
  } else if (hash.match(/(\d|[a-z]|[A-Z]){12}/)) {
    if (boards[hash]) {
      return (
        <BoardDialog board={hash} />
      );
    } else {
      navigateTo = "";
    }
  }
}
function TaskDialog(props) {
  const {boards, updateBoards} = useContext(BoardsContext);
  const [task, updateTask] = useState(boards[props.board].task[props.task]);
  const navigate = useNavigate();
  const deleteTask = (e) => {
    e.preventDefault();
    let updatedBoards = clone(boards);
    updatedBoards[props.board].task.splice(props.task, 1);
    updateBoards(updatedBoards);
    navigate("");
  };
  const closeDialog = (e) => {
    e.preventDefault();
    if (task.title.length > 0) {
      let updatedBoards = clone(boards);
      updatedBoards[props.board].task[props.task] = task;
      updatedBoards[props.board].profile.timestamp = new Date().toISOString();
      updateBoards(updatedBoards);
      navigate("");
    }
  };
  const cancelClick = (e) => {
    e.stopPropagation();
  };
  return (
    <div className="dialog-box" onClick={closeDialog}>
      <div className="dialog" onClick={cancelClick}>
        <TaskTitle task={task} updateTask={updateTask} />
        <Schedule task={task} updateTask={updateTask} />
        <Repeat task={task} updateTask={updateTask} />
        <Description task={task} updateTask={updateTask} />
        <div className="control">
          <a href="" className="delete" onClick={deleteTask}>
            タスクを削除
          </a>
          <a href="" className="save" state={task.title.length > 0 ? "enabled" : "disabled"} onClick={closeDialog}>
            OK
          </a>
        </div>
      </div>
    </div>
  );
}
function BoardDialog(props) {
  const {boards, updateBoards} = useContext(BoardsContext);
  const [board, updateBoard] = useState(boards[props.board]);
  const navigate = useNavigate();
  const deleteBoard = (e) => {
    e.preventDefault();
    let updatedBoards = clone(boards);
    delete updatedBoards[props.board];
    updateBoards(updatedBoards);
    navigate("/");
  };
  const closeDialog = (e) => {
    e.preventDefault();
    if (board.profile.title.length > 0) {
      let updatedBoards = clone(boards);
      updatedBoards[props.board] = board;
      updatedBoards[props.board].profile.timestamp = new Date().toISOString();
      updateBoards(updatedBoards);
      navigate("");
    }
  };
  const cancelClick = (e) => {
    e.stopPropagation();
  };
  return (
    <div className="dialog-box" onClick={closeDialog}>
      <div className="dialog" onClick={cancelClick}>
        <BoardTitle board={board} updateBoard={updateBoard} />
        <BoardColor board={board} updateBoard={updateBoard} />
        <OnDashboard board={board} updateBoard={updateBoard} />
        <div className="control">
          <a href="" className="delete" onClick={deleteBoard}>
            ボードを削除
          </a>
          <a href="" className="save" state={board.profile.title.length > 0 ? "enabled" : "disabled"} onClick={closeDialog}>
            OK
          </a>
        </div>
      </div>
    </div>
  );
}

function listTasks(boards, target, callback, dashboard) {
  let tasks = [];
  const getTasks = (board) => {
    if (!dashboard || boards[board].profile.onDashboard) {
      for (let i = 0; i < boards[board].task.length; i++) {
        if (callback(boards[board].task[i])) {
          tasks.push([board, i]);
        }
      }
    }
  }
  if (target) getTasks(target);
  else for (let board in boards) getTasks(board);
  tasks.sort((first, second) => {
    if (boards[first[0]].task[first[1]].schedule && boards[second[0]].task[second[1]].schedule) {
      if (boards[first[0]].task[first[1]].schedule.replace(/[^0-9]/g, "") < boards[second[0]].task[second[1]].schedule.replace(/[^0-9]/g, "")) return -1;
      if (boards[first[0]].task[first[1]].schedule.replace(/[^0-9]/g, "") > boards[second[0]].task[second[1]].schedule.replace(/[^0-9]/g, "")) return 1;
      return 0;
    } else {
      if (boards[first[0]].profile.timestamp.replace(/[^0-9]/g, "") < boards[second[0]].profile.timestamp.replace(/[^0-9]/g, "")) return 1;
      if (boards[first[0]].profile.timestamp.replace(/[^0-9]/g, "") > boards[second[0]].profile.timestamp.replace(/[^0-9]/g, "")) return -1;
      return 0;
    }
  });
  return tasks;
}
function DoneTasks(props) {
  const {boards, updateBoards} = useContext(BoardsContext);
  const tasks = listTasks(boards, props.target, (task) => {
    return task.isDone;
  }, props.dashboard);
  if (tasks.length) {
    return (
      <div>
        <h3 className="done">完了したタスク</h3>
        {
          tasks.map((task) => {
            return <Task key={task[0] + "." + task[1]} board={task[0]} task={task[1]} />;
          })
        }
      </div>
    );
  }
}
function AsapTasks(props) {
  const {boards, updateBoards} = useContext(BoardsContext);
  return listTasks(boards, props.target, (task) => {
    return !task.schedule && !task.isDone;
  }, props.dashboard).map((task) => {
    return <Task key={task[0] + "." + task[1]} board={task[0]} task={task[1]} />;
  });
}
function PastTasks(props) {
  const {boards, updateBoards} = useContext(BoardsContext);
  const tasks = listTasks(boards, props.target, (task) => {
    if (task.schedule) {
      const now = new Date();
      const taskDate = new Date(task.schedule);
      return taskDate < now && !(now.getFullYear() == taskDate.getFullYear() && now.getMonth() == taskDate.getMonth() &&now.getDate() == taskDate.getDate()) && !task.isDone;
    }
  }, props.dashboard);
  if (tasks.length) {
    return (
      <div>
        <h3>過去のタスク</h3>
        {
          tasks.map((task) => {
            return <Task key={task[0] + "." + task[1]} board={task[0]} task={task[1]} />;
          })
        }
      </div>
    );
  }
}
function DayTasks(props) {
  const {boards, updateBoards} = useContext(BoardsContext);
  const tasks = listTasks(boards, props.target, (task) => {
    if (task.schedule) {
      const now = new Date();
      const taskDate = new Date(task.schedule);
      return now.getFullYear() == taskDate.getFullYear() && now.getMonth() == taskDate.getMonth() && now.getDate() == taskDate.getDate() && !task.isDone;
    }
  }, props.dashboard);
  if (tasks.length) {
    return (
      <div>
        <h3>今日</h3>
        {
          tasks.map((task) => {
            return <Task key={task[0] + "." + task[1]}  board={task[0]} task={task[1]} />;
          })
        }
      </div>
    );
  }
}
function WeekTasks(props) {
  const {boards, updateBoards} = useContext(BoardsContext);
  const tasks = listTasks(boards, props.target, (task) => {
    if (task.schedule) {
      const now = new Date();
      const taskDate = new Date(task.schedule);
      return now < taskDate && now.getDate() != taskDate.getDate() && taskDate.getTime() - now.getTime() < 604800000 && !task.isDone;
    }
  }, props.dashboard);
  if (tasks.length) {
    return (
      <div>
        <h3>今週</h3>
        {
          tasks.map((task) => {
            return <Task key={task[0] + "." + task[1]}  board={task[0]} task={task[1]} />;
          })
        }
      </div>
    );
  }
}
function LaterTasks(props) {
  const {boards, updateBoards} = useContext(BoardsContext);
  const tasks = listTasks(boards, props.target, (task) => {
    if (task.schedule) {
      const now = new Date();
      const taskDate = new Date(task.schedule);
      return taskDate.getTime() - now.getTime() >= 604800000 && !task.isDone;
    }
  }, props.dashboard);
  if (tasks.length) {
    return (
      <div>
        <h3>来週以降</h3>
        {
          tasks.map((task) => {
            return <Task key={task[0] + "." + task[1]} board={task[0]} task={task[1]} />;
          })
        }
      </div>
    );
  }
}
function Dashboard() {
  return (
    <div className="body with-menu">
      <div className="column">
        <Title content="すべてのタスク" />
        <AsapTasks dashboard />
        <PastTasks dashboard />
        <DayTasks dashboard />
        <WeekTasks dashboard />
        <LaterTasks dashboard />
        <DoneTasks dashboard />
      </div>
    </div>
  );
}
function TaskList(props) {
  const {boards, updateBoards} = useContext(BoardsContext);
  const addTask = (e) => {
    e.target.href = "#" + props.target + "." + boards[props.target].task.length;
    let updatedBoards = clone(boards);
    updatedBoards[props.target].task.push({
      title: "新規タスク",
      schedule: null,
      repeat: 0,
      discription: "",
      isDone: false
    });
    updateBoards(updatedBoards);
  };
  return (
    <div className="body with-menu">
      <div className="column">
        <Title content={boards[props.target].profile.title} setting={props.target} />
        <AsapTasks target={props.target} />
        <PastTasks target={props.target} />
        <DayTasks target={props.target} />
        <WeekTasks target={props.target} />
        <LaterTasks target={props.target} />
        <a className="add button" href="" onClick={addTask}>
          タスクを追加
        </a>
        <DoneTasks target={props.target} />
      </div>
    </div>
  );
}

function Title(props) {
  if (props.setting) {
    return (
      <div className="title">
        <h2>{props.content}</h2>
        <a className="detail-box" href={"#" + props.setting}>
          <img className="detail" src="/img/detail.svg" />
        </a>
      </div>
    );
  } else {
    return (
      <div className="title">
        <h2>{props.content}</h2>
      </div>
    );
  }
}

function Task(props) {
  const {boards, updateBoards} = useContext(BoardsContext);
  let schedule;
  if (boards[props.board].task[props.task].schedule) {
    const now = new Date();
    const taskDate = new Date(boards[props.board].task[props.task].schedule);
    if (now.getFullYear() == taskDate.getFullYear() && now.getMonth() == taskDate.getMonth() && now.getDate() == taskDate.getDate()) {
      schedule = String(taskDate.getHours()).padStart(2, "0") + ":" + String(taskDate.getMinutes()).padStart(2, "0");
    } else if (taskDate < now) {
      schedule = (now.getTime() - now.getHours() * 3600000 - now.getMinutes() * 60000 - now.getSeconds() * 1000 - now.getMilliseconds() - taskDate.getTime() + taskDate.getHours() * 3600000 + taskDate.getMinutes() * 60000 + taskDate.getSeconds() * 1000 + taskDate.getMilliseconds()) / 86400000 + "日前";
    } else if (taskDate.getTime() - now.getTime() < 604800000) {
      schedule = dayName[taskDate.getDay()] + "曜日";
    } else if (now.getFullYear() == taskDate.getFullYear()) {
      schedule = String(taskDate.getMonth() + 1).padStart(2, "0") + "/" + String(taskDate.getDate()).padStart(2, "0");
    } else {
      schedule = taskDate.getFullYear() + "/" + String(taskDate.getMonth() + 1).padStart(2, "0") + "/" + String(taskDate.getDate()).padStart(2, "0");
    }
  }
  const updateIsDone = (e) => {
    e.preventDefault();
    let updatedBoards = clone(boards);
    updatedBoards[props.board].task[props.task].isDone = !boards[props.board].task[props.task].isDone;
    if (updatedBoards[props.board].task[props.task].isDone && boards[props.board].task[props.task].schedule) {
      const schedule = new Date(boards[props.board].task[props.task].schedule);
      switch (boards[props.board].task[props.task].repeat) {
        case 1:
          schedule.setDate(schedule.getDate() + 7);
          updatedBoards[props.board].task[props.task].schedule = schedule.toISOString();
          updatedBoards[props.board].task[props.task].isDone = false;
          break;
        case 2:
          schedule.setDate(schedule.getDate() + 1);
          updatedBoards[props.board].task[props.task].schedule = schedule.toISOString();
          updatedBoards[props.board].task[props.task].isDone = false;
          break;
      }
    }
    updateBoards(updatedBoards);
  }
  return (
    <div className={boards[props.board].task[props.task].isDone ? "task-box done" : "task-box"}>
      <a onClick={updateIsDone} className="check button" href="" color={boards[props.board].profile.color}></a>
      <a className="task button" href={"#" + props.board + "." + props.task}>
        <div className="title">
          {boards[props.board].task[props.task].title}
        </div>
        <div className="schedule">
          {schedule}
        </div>
      </a>
    </div>
  );
}

function Board() {
  const {boards, updateBoards} = useContext(BoardsContext);
  const {boardId} = useParams();
  const navigate = useNavigate();
  let navigateTo;
  useEffect(() => {
    if (navigateTo || navigateTo === "") {
      navigate(navigateTo);
    }
  }, [navigateTo]);

  if (boards[boardId]) {
    document.title = boards[boardId].profile.title + " - Tidy";
    return (
      <div id="base">
        <Header />
        <TaskList target={boardId} />
        <Menu />
        <Popup />
      </div>
    );
  } else {
    navigateTo = "/";
  }
}

export default App;
