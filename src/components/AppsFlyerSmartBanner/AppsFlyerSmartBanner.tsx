import { useEffect } from 'react';

const getScript = ({ scriptId, webKey }: { scriptId: string; webKey: string; }) => `
  !function(t,e,n,s,a,c,i,o,p){t.AppsFlyerSdkObject=a,t.AF=t.AF||function(){
  (t.AF.q=t.AF.q||[]).push([Date.now()].concat(Array.prototype.slice.call(arguments)))},
  t.AF.id=t.AF.id||i,t.AF.plugins={},o=e.createElement(n),p=e.getElementsByTagName(n)[0],o.async=1,o.id="${scriptId}",
  o.src="https://websdk.appsflyer.com?"+(c.length>0?"st="+c.split(",").sort().join(",")+"&":"")+(i.length>0?"af_id="+i:""),
  p.parentNode.insertBefore(o,p)}(window,document,"script",0,"AF","banners",{banners: {key: "${webKey}"}});
`;

export type AppsFlyerSmartBannerProps = Readonly<{
  webKey: string;
}>;

/**
 * Компонент для встраивания баннера с предложением скачать нативное приложение.
 *
 * {@link https://dev.appsflyer.com/hc/docs/dl_smart_banner_v2|Документация баннера AppsFlyer}
 * @param props
 * @constructor
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const AppsFlyerSmartBanner = (props: AppsFlyerSmartBannerProps) => {
  const { webKey }: AppsFlyerSmartBannerProps = props;

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    if (!webKey) {
      // eslint-disable-next-line no-console
      console.warn('Missing required webKey for AppsFlyer script. Script appending aborted.');

      return;
    }

    /**
     * MDN советует при определении Safari дополнительно проверять не Chrome ли это.
     * https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent#browser_name_and_version
     */
    const isChromeAndNotSafariRegex = /(?:CriOS\/|Chrome\/(?!.*(?:Edg|Edge|OPR|Opera|SamsungBrowser)))(?!^(?!.*Chrome).*Safari)/;

    const scriptId = `appsflyer-script-${webKey}`;

    /**
     * Вставляем Web SDK только один раз даже при перемонтировании компонента.
     */
    if (document.getElementById(scriptId)) {
      return;
    }

    const script = document.createElement('script');

    script.id = scriptId;
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = getScript({ scriptId, webKey });

    /**
     * Мы не хотим показывать баннер AppsFlyer на Safari, т.к. там будет отображаться нативный баннер.
     * https://onetwotripdev.atlassian.net/browse/REF-18
     */
    if (isChromeAndNotSafariRegex.test(window.navigator.userAgent)) {
      script.innerHTML += `AF('banners', 'showBanner');`;
    }

    // Обработка ошибок, если что-то пойдет не так при вставке скрипта
    try {
      document.head.appendChild(script);
    } catch (error) {
      console.error('Failed to append AppsFlyer script:', error);
    }

    // Если компонент будет размонтирован, удаляем добавленный скрипт, чтобы избежать утечек памяти
    return () => {
      const scriptElement = document.getElementById(scriptId);
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, [webKey]);

  return null;
};

export default AppsFlyerSmartBanner;
