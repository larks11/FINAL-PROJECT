export const getShippingFee = (city = '', region = '', fees = {}) => {
  const location = (city + ' ' + region).toLowerCase();

  const visayas = [
    'cebu','mandaue','lapu-lapu','lapulapu','talisay','danao','toledo',
    'bogo','iloilo','bacolod','dumaguete','tagbilaran','boracay','roxas',
    'ormoc','tacloban','palo','tanauan','tolosa','dulag','abuyog',
    'baybay','maasin','burauen','carigara','naval','catbalogan','calbayog',
    'leyte','samar','bohol','negros','panay','visayas',
  ];
  const mindanao = [
    'davao','cagayan','cdo','cagayan de oro','zamboanga','general santos',
    'gensan','cotabato','butuan','iligan','surigao','pagadian',
    'koronadal','tacurong','kidapawan','midsayap','mindanao',
  ];
  const luzon = [
    'manila','quezon','makati','pasig','marikina','caloocan','malabon',
    'navotas','valenzuela','las pinas','paranaque','pasay','taguig',
    'mandaluyong','san juan','muntinlupa','pateros','cavite','laguna',
    'batangas','rizal','bulacan','pampanga','tarlac','pangasinan',
    'bataan','zambales','nueva ecija','metro manila','ncr','luzon',
  ];

  const f = {
    visayas: fees.visayas ?? 80,
    mindanao: fees.mindanao ?? 150,
    luzon: fees.luzon ?? 200,
    default: fees.default ?? 150,
  };

  if (visayas.some((k) => location.includes(k))) return f.visayas;
  if (mindanao.some((k) => location.includes(k))) return f.mindanao;
  if (luzon.some((k) => location.includes(k))) return f.luzon;
  return f.default;
};

export const getRegionLabel = (city = '', region = '') => {
  const location = (city + ' ' + region).toLowerCase();
  const visayas = ['cebu','mandaue','lapu-lapu','lapulapu','talisay','danao','toledo','bogo','iloilo','bacolod','dumaguete','tagbilaran','boracay','roxas','ormoc','tacloban','palo','tanauan','tolosa','dulag','abuyog','baybay','maasin','burauen','carigara','naval','catbalogan','calbayog','leyte','samar','bohol','negros','panay','visayas'];
  const mindanao = ['davao','cagayan','cdo','cagayan de oro','zamboanga','general santos','gensan','cotabato','butuan','iligan','surigao','pagadian','koronadal','tacurong','kidapawan','midsayap','mindanao'];
  if (visayas.some((k) => location.includes(k))) return 'Within Visayas';
  if (mindanao.some((k) => location.includes(k))) return 'Visayas → Mindanao';
  return 'Visayas → Luzon';
};

export const calcPrices = (orderItems, city = '', region = '', fees = {}, vatRate = 0) => {
  const itemsPrice = orderItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shippingPrice = getShippingFee(city, region, fees);
  const taxPrice = Number(((vatRate / 100) * itemsPrice).toFixed(2));
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  return {
    itemsPrice: Number(itemsPrice.toFixed(2)),
    shippingPrice: Number(shippingPrice.toFixed(2)),
    taxPrice: Number(taxPrice.toFixed(2)),
    totalPrice: Number(totalPrice.toFixed(2)),
  };
};