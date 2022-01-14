"use strict";

const SELECTOR = {
  ID_POST_TEMPL: "post-template",
  CLASS_ROOT: "table",
  CLASS_TCATION: "table-caption",
  CLASS_TFOOTER: "table-footer",
  CLASS_TBODY: "table-body",
  CLASS_POST: "tr-post",
  CLASS_ID: "td-id",
  CLASS_POST_TITLE: "td-title",
  CLASS_POST_BODY: "td-body",
  CLASS_ICON_SAVE: "icon-save",
  CLASS_BTN_DELETE: "delete-icon",
  CLASS_BTN_EDIT: "edit_icon",
  CLASS_INPUT_TITLE: "input-title",
  CLASS_INPUT_BODY: "input-body",
  CLASS_TITLE_ERROR: "title-error",
  CLASS_BODY_ERROR: "body-error",
  CLASS_SHOW: "show",
  CLASS_NO_ID: "waitingForId",
  CLASS_LOAD: "lds-spinner",
  CLASS_ACTIVE: "active",
  CLASS_HIDDEN: "hidden",
  CLASS_UPDATING: "updating",
  CLASS_BTN_UPDATE: "btn-update",
  CLASS_BTN_SAVE: "btn-save",
  CLASS_SERV_ERROR: "server-error",
};

const ROOT = document.querySelector("." + SELECTOR.CLASS_ROOT);

const ELEMENT = {
  TFOOTER: ROOT.querySelector("." + SELECTOR.CLASS_TFOOTER),
  TBODY: ROOT.querySelector("." + SELECTOR.CLASS_TBODY),
  INPUT_TITLE: ROOT.querySelector("." + SELECTOR.CLASS_INPUT_TITLE),
  INPUT_BODY: ROOT.querySelector("." + SELECTOR.CLASS_INPUT_BODY),
  ERROR_TITLE: ROOT.querySelector("." + SELECTOR.CLASS_TITLE_ERROR),
  ERROR_BODY: ROOT.querySelector("." + SELECTOR.CLASS_BODY_ERROR),
  BTN_EDIT: ROOT.querySelector("." + SELECTOR.CLASS_BTN_UPDATE),
  BTN_SAVE: ROOT.querySelector("." + SELECTOR.CLASS_BTN_SAVE),
};

const HTML = {
  POST_TEMPL: document.querySelector("#" + SELECTOR.ID_POST_TEMPL).innerHTML,
};

let POST_TO_EDIT = {
  id: "",
  title: "",
  body: "",
};

ELEMENT.TFOOTER.addEventListener("click", (e) => onTfooterClick(e));
ELEMENT.TBODY.addEventListener("click", (e) => onTbodyClick(e));

init();

function onTfooterClick(e) {
  const target = e.target;

  clearErrors();

  if (isTarget(target, SELECTOR.CLASS_ICON_SAVE)) {
    if (isInputsValue()) {
      createPost();
      clearInputs();

      return;
    }

    showEror();
  }

  if (isTarget(target, SELECTOR.CLASS_BTN_EDIT)) {
    if (isInputsValue()) {
      updatePost();
      clearInputs();
      hideUpdateBtn();

      return;
    }

    showEror();
  }
}

function onTbodyClick(e) {
  const target = e.target;

  if (isTarget(target, SELECTOR.CLASS_BTN_DELETE)) {
    removePost(target);
  }

  if (isTarget(target, SELECTOR.CLASS_BTN_EDIT)) {
    editPost(target);
  }
}

function init() {
  const remoutData = PostAPI.getList();

  toggleLoading();

  remoutData
    .then((posts) => {
      const postsHtml = posts
        .map((post) => renderHtml(post.id, post.title, post.body))
        .join("");

      ELEMENT.TBODY.innerHTML = postsHtml;
    })
    .then(() => toggleLoading())
    .catch((error) => showServerError(error));
}

function createPost() {
  const title = ELEMENT.INPUT_TITLE.value;
  const body = ELEMENT.INPUT_BODY.value;
  const postHtml = renderHtml("", title, body);

  ELEMENT.TBODY.insertAdjacentHTML("afterbegin", postHtml);

  toggleLoading();

  addOnServer()
    .then((res) => {
      getIdfromServer(res);
    })
    .then(() => toggleLoading())
    .catch((error) => showServerError(error));
}

function getIdfromServer(res) {
  const post = ELEMENT.TBODY.querySelector("." + SELECTOR.CLASS_NO_ID);
  const id = res.data.id;

  post.querySelector("." + SELECTOR.CLASS_ID).textContent = id;
  post.classList.remove(SELECTOR.CLASS_NO_ID);
}

function toggleLoading() {
  const parent = ROOT.querySelector("." + SELECTOR.CLASS_TCATION);
  const loading = parent.querySelector("." + SELECTOR.CLASS_LOAD);

  loading.classList.toggle(SELECTOR.CLASS_ACTIVE);
}

function removePost(target) {
  const post = target.closest("." + SELECTOR.CLASS_POST);
  const id = post.querySelector("." + SELECTOR.CLASS_ID).textContent;

  post.remove();
  toggleLoading();

  removeFromServer(id)
    .then(() => toggleLoading())
    .catch((error) => showServerError(error));
}

function editPost(target) {
  const post = target.closest("." + SELECTOR.CLASS_POST);
  const title = post.querySelector("." + SELECTOR.CLASS_POST_TITLE).textContent;
  const body = post.querySelector("." + SELECTOR.CLASS_POST_BODY).textContent;

  post.classList.add(SELECTOR.CLASS_UPDATING);
  POST_TO_EDIT.id = post.querySelector("." + SELECTOR.CLASS_ID).textContent;
  ELEMENT.INPUT_TITLE.value = title;
  ELEMENT.INPUT_BODY.value = body;

  showUpdateBtn();
}

function updatePost() {
  const post = ELEMENT.TBODY.querySelector("." + SELECTOR.CLASS_UPDATING);

  post.querySelector(`.${SELECTOR.CLASS_POST_TITLE} p`).textContent =
    ELEMENT.INPUT_TITLE.value;
  post.querySelector(`.${SELECTOR.CLASS_POST_BODY} p`).textContent =
    ELEMENT.INPUT_BODY.value;

  post.classList.remove(SELECTOR.CLASS_UPDATING);

  toggleLoading();
  updatePostOnServer().catch((error) => showServerError(error));
}

function updatePostOnServer() {
  POST_TO_EDIT.title = ELEMENT.INPUT_TITLE.value;
  POST_TO_EDIT.body = ELEMENT.INPUT_BODY.value;

  return PostAPI.update(POST_TO_EDIT, POST_TO_EDIT.id).then(() =>
    toggleLoading()
  );
}

function showUpdateBtn() {
  ELEMENT.BTN_EDIT.classList.add(SELECTOR.CLASS_ACTIVE);
  ELEMENT.BTN_SAVE.classList.add(SELECTOR.CLASS_HIDDEN);
}

function hideUpdateBtn() {
  ELEMENT.BTN_EDIT.classList.remove(SELECTOR.CLASS_ACTIVE);
  ELEMENT.BTN_SAVE.classList.remove(SELECTOR.CLASS_HIDDEN);
}

function addOnServer() {
  const post = {
    user_id: 128,
    title: ELEMENT.INPUT_TITLE.value,
    body: ELEMENT.INPUT_BODY.value,
  };

  return PostAPI.create(post);
}

function removeFromServer(id) {
  return PostAPI.delete(id);
}

function renderHtml(id, title, body) {
  return HTML.POST_TEMPL.replace("{{class-id}}", isId(id))
    .replace("{{id}}", id)
    .replace("{{title}}", title)
    .replace("{{body}}", body);
}

function isId(id) {
  return id ? "" : SELECTOR.CLASS_NO_ID;
}

function clearInputs() {
  ELEMENT.INPUT_TITLE.value = "";
  ELEMENT.INPUT_BODY.value = "";
}

function isTarget(el, selector) {
  return el.classList.contains(selector);
}

function isInputsValue() {
  return ELEMENT.INPUT_TITLE.value !== "" && ELEMENT.INPUT_BODY.value !== "";
}

function showEror() {
  if (ELEMENT.INPUT_TITLE.value == "") {
    ELEMENT.ERROR_TITLE.classList.add(SELECTOR.CLASS_SHOW);
  }

  if (ELEMENT.INPUT_BODY.value == "") {
    ELEMENT.ERROR_BODY.classList.add(SELECTOR.CLASS_SHOW);
  }
}

function clearErrors() {
  ELEMENT.ERROR_TITLE.classList.remove(SELECTOR.CLASS_SHOW);
  ELEMENT.ERROR_BODY.classList.remove(SELECTOR.CLASS_SHOW);
}

function showServerError(message) {
  const error = document.querySelector("." + SELECTOR.CLASS_SERV_ERROR);

  error.textContent = message;
  error.classList.add(SELECTOR.CLASS_SHOW);

  setTimeout(() => {
    error.classList.remove(SELECTOR.CLASS_SHOW);
  }, 4000);
}
