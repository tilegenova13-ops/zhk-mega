/* Общий модуль авторизации ЖК Мега (Firebase Auth + Firestore).
   Вход по номеру телефона и паролю: номер превращается во внутренний
   логин вида 77011234567@zhk-mega.app (провайдер Email/Password). */
(function(){
  const cfg = window.ZHK_FIREBASE || {};
  const Z = window.ZHK = { ready: false, auth: null, db: null };

  Z.normPhone = v => {
    let d = String(v || "").replace(/\D/g, "");
    if (d.length === 11 && d[0] === "8") d = "7" + d.slice(1);
    if (d.length === 10) d = "7" + d;
    return d;
  };
  Z.validPhone = d => /^7\d{10}$/.test(d);
  Z.phoneEmail = d => d + "@zhk-mega.app";
  Z.phoneFromEmail = e => String(e || "").split("@")[0];
  Z.fmtPhone = d => /^7\d{10}$/.test(d) ? `+7 ${d.slice(1,4)} ${d.slice(4,7)} ${d.slice(7,9)} ${d.slice(9)}` : (d || "");

  Z.authError = e => {
    const c = (e && e.code) || "";
    const map = {
      "auth/invalid-credential": "Неверный номер телефона или пароль.",
      "auth/invalid-login-credentials": "Неверный номер телефона или пароль.",
      "auth/wrong-password": "Неверный номер телефона или пароль.",
      "auth/user-not-found": "Такой номер не зарегистрирован. Перейдите на вкладку «Регистрация».",
      "auth/email-already-in-use": "Этот номер уже зарегистрирован. Войдите или обратитесь к администратору, если забыли пароль.",
      "auth/weak-password": "Пароль слишком простой — минимум 6 символов.",
      "auth/too-many-requests": "Слишком много попыток. Подождите несколько минут.",
      "auth/network-request-failed": "Нет связи с интернетом. Проверьте подключение.",
      "auth/operation-not-allowed": "Вход по паролю не включён в Firebase (Authentication → Sign-in method → Email/Password).",
      "auth/configuration-not-found": "Авторизация не настроена в Firebase (Authentication → Get started).",
      "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "Неверные настройки Firebase (apiKey) в файле firebase-config.js.",
      "auth/invalid-api-key": "Неверные настройки Firebase (apiKey) в файле firebase-config.js.",
      "auth/unauthorized-domain": "Адрес сайта не добавлен в Firebase (Authentication → Settings → Authorized domains).",
      "auth/requires-recent-login": "Войдите заново и повторите.",
      "permission-denied": "Нет доступа. Проверьте правила Firestore."
    };
    return map[c] || ("Ошибка: " + (e && e.message ? e.message : c || "неизвестная"));
  };

  if (!cfg.apiKey || !cfg.projectId || !window.firebase) return;
  try {
    firebase.initializeApp(cfg);
    Z.auth = firebase.auth();
    Z.db = firebase.firestore();
    Z.ready = true;
  } catch (e) { console.error("Firebase init failed", e); return; }

  Z.signIn = (phone, pass) => Z.auth.signInWithEmailAndPassword(Z.phoneEmail(phone), pass);
  Z.signUp = async (phone, pass, profile) => {
    const c = await Z.auth.createUserWithEmailAndPassword(Z.phoneEmail(phone), pass);
    await Z.db.collection("users").doc(c.user.uid).set({
      phone, name: profile.name || "", apt: profile.apt || "", ent: profile.ent || "",
      createdAt: new Date().toISOString()
    });
    return c.user;
  };
  Z.signOut = () => Z.auth.signOut();
  Z.changePassword = async (cur, next) => {
    const u = Z.auth.currentUser;
    await u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, cur));
    await u.updatePassword(next);
  };
  Z.isAdmin = async uid => {
    try { return (await Z.db.collection("admins").doc(uid).get()).exists; }
    catch (e) { return false; }
  };
})();
