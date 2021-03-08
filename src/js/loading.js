//模型未加载成功动画
export function objLoading() {
  let loading = document.createElement('div');
  document.body.appendChild(loading);
  loading.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:15;background:white;opacity: 1;transition: 1s;';
  let loadingDiv = document.createElement('div');
  loadingDiv.className = 'loader';
  loading.appendChild(loadingDiv);
  let loadingSpan1 = document.createElement('span');
  loadingDiv.appendChild(loadingSpan1);
  let loadingSpan2 = document.createElement('span');
  loadingDiv.appendChild(loadingSpan2);
  let loadingSpan3 = document.createElement('span');
  loadingDiv.appendChild(loadingSpan3);
  let loadingSpan4 = document.createElement('span');
  loadingDiv.appendChild(loadingSpan4);
  let loadingSpan5 = document.createElement('span');
  loadingDiv.appendChild(loadingSpan5);
  let loadingSpan6 = document.createElement('span');
  loadingDiv.appendChild(loadingSpan6);
  let loadingSpan7 = document.createElement('span');
  loadingDiv.appendChild(loadingSpan7);
  let loadingSpan8 = document.createElement('span');
  loadingDiv.appendChild(loadingSpan8);
  let loadingSpan9 = document.createElement('span');
  loadingDiv.appendChild(loadingSpan9);
  let loadingSpan10 = document.createElement('span');
  loadingDiv.appendChild(loadingSpan10);
  let loadingSpan11 = document.createElement('span');
  loadingDiv.appendChild(loadingSpan11);
  let loadingSpan12 = document.createElement('span');
  loadingDiv.appendChild(loadingSpan12);
  let loadingSpan13 = document.createElement('span');
  loadingDiv.appendChild(loadingSpan13);
  let loadingSpan14 = document.createElement('span');
  loadingDiv.appendChild(loadingSpan14);
  let loadingSpan15 = document.createElement('span');
  loadingDiv.appendChild(loadingSpan15);
  let loadingTitle = document.createElement('div');
  loadingTitle.innerText = '';
  loadingTitle.style.cssText = 'text-align:center;margin-top:30%;font-size: 14px;font-weight: lighter;font-family: "Agency FB";';
  loading.appendChild(loadingTitle);
}

//模型加载成功动画
export function objLoad() {
  setTimeout(() => {
    loading.style.opacity = 0;
    setTimeout(() => {
      loading.remove();
    }, 2000)
  }, 2000)
}