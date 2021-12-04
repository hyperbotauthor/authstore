const lichessHost = "https://lichess.org";
const clientId = "example.com";

const clientUrl = (() => {
  const url = new URL(location.href);
  url.search = "";
  return url.href;
})();

const oauth = new OAuth2AuthCodePKCE.OAuth2AuthCodePKCE({
  authorizationUrl: `${lichessHost}/oauth`,
  tokenUrl: `${lichessHost}/api/token`,
  clientId,
  scopes: ["email:read"],
  redirectUrl: clientUrl,
  onAccessTokenExpiry: (refreshAccessToken) => refreshAccessToken(),
  onInvalidGrant: (_retry) => {},
});

async function login() {
  // Redirect to authentication prompt.
  await oauth.fetchAuthorizationCode();
}

async function useApi() {
  const res = await fetch(`${lichessHost}/api/account/email`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("LICHESS_TOKEN")}`,
    },
  });
  this.email = (await res.json()).email;
  console.log(email);
}

function updateToken() {
  const token = localStorage.getItem("LICHESS_TOKEN");

  console.log("update token to", token);

  document.getElementById("LICHESS_TOKEN").value = token;

  const buttonElements = ["logoutbutton", "useapibutton"].map((id) =>
    document.getElementById(id)
  );

  buttonElements.forEach((e) =>
    token ? e.removeAttribute("disabled") : e.setAttribute("disabled", true)
  );
}

async function init() {
  updateToken();
  try {
    const hasAuthCode = await oauth.isReturningFromAuthServer();
    if (hasAuthCode) {
      const accessContext = await oauth.getAccessToken();

      console.log(accessContext);

      localStorage.setItem("LICHESS_TOKEN", accessContext.token.value);

      updateToken();
    }
  } catch (err) {
    console.log(err);
  }
}

async function logout() {
  const token = localStorage.getItem("LICHESS_TOKEN");

  const response = await fetch(`${lichessHost}/api/token`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("logout status", response.status);

  const text = await response.text();

  console.log(text);

  localStorage.removeItem("LICHESS_TOKEN");

  document.location.href = "/";
}
