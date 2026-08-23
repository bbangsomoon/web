type KakaoPostcodeData = {
  address: string;
  roadAddress: string;
  jibunAddress: string;
  zonecode: string;
};

type KakaoPostcodeOptions = {
  oncomplete: (data: KakaoPostcodeData) => void;
  onclose?: () => void;
};

type KakaoPostcodeInstance = {
  open: (options?: { popupTitle?: string }) => void;
};

interface Window {
  kakao?: {
    Postcode: new (options: KakaoPostcodeOptions) => KakaoPostcodeInstance;
  };
}
