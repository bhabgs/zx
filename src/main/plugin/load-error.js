/**
 *
 * @param {String} host
 * @param {String} des
 */
export function loadErrorPage(host, des) {
  let code = `(function() {
    let h3 = document.createElement("h3");
    h3.textContent = "无法访问网站";
    h3.style.marginTop = "50px";
    let p1 = document.createElement("p");
    p1.innerHTML = "<b>${host}</b> 的响应时间过长";
    p1.style.marginTop = "20px";
    p1.style.marginBottom = "20px";
    let p2 = document.createElement("p");
    p2.textContent = "${des}";
    document.body.appendChild(h3);
    document.body.appendChild(p1);
    document.body.appendChild(p2);
  })();`;

  return code;
}
