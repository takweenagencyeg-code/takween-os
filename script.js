const API='https://hanon-store-rebuilt.takween-agency-eg.chatgpt.site';
const remoteAsset=(value)=>String(value||'').startsWith('/api/images/')?`${API}${value}`:value;
const defaultSlides=[
  {src:'https://hanon-store-rebuilt.takween-agency-eg.chatgpt.site/assets/trio-sage-still.png',alt:'ثلاث درجات هادئة من عبايات هنون',label:'SOFT TONES'},
  {src:'https://hanon-store-rebuilt.takween-agency-eg.chatgpt.site/assets/hero-emerald.png',alt:'إطلالة هنون الخضراء بقصة واسعة وانسيابية',label:'THE EMERALD EDIT'},
  {src:'https://hanon-store-rebuilt.takween-agency-eg.chatgpt.site/assets/bag-front.png',alt:'موديل هنون تحمل حقيبة البراند مع عباية خضراء',label:'THE HANON SIGNATURE'},
  {src:'https://hanon-store-rebuilt.takween-agency-eg.chatgpt.site/assets/bag-side.png',alt:'تفاصيل جانبية لعباية هنون الخضراء وحقيبة البراند',label:'QUIETLY DETAILED'}
];
let slides=[...defaultSlides],currentSlide=0,quantity=1,products=[],autoplay=true,intervalMs=4800,sliderTimer=null,transitionId=0;
const heroImage=document.querySelector('#heroImage'),heroLabel=document.querySelector('#heroLabel'),counter=document.querySelector('#slideCounter'),dots=document.querySelector('#sliderDots');

function parseList(value){try{const list=JSON.parse(value||'[]');return Array.isArray(list)?list.map(String):[]}catch{return []}}
function buildDots(){dots.innerHTML='';slides.forEach((slide,index)=>{const dot=document.createElement('button');dot.type='button';dot.ariaLabel=`عرض الصورة ${index+1}: ${slide.alt||''}`;dot.addEventListener('click',()=>showSlide(index,true));dots.append(dot)});}
function restartTimer(){clearInterval(sliderTimer);if(autoplay&&slides.length>1&&!document.hidden)sliderTimer=setInterval(()=>showSlide(currentSlide+1),intervalMs);}
function applySlide(index){const slide=slides[index];currentSlide=index;heroImage.src=remoteAsset(slide.src);heroImage.alt=slide.alt||'صورة من مجموعة هنون';heroLabel.textContent=slide.label||'';counter.textContent=`${String(index+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;[...dots.children].forEach((d,i)=>d.classList.toggle('active',i===index));heroImage.style.opacity='1';}
function showSlide(index,manual=false){
  if(!slides.length)return;
  const next=(index+slides.length)%slides.length,slide=slides[next],request=++transitionId,preload=new Image();
  preload.onload=()=>{if(request!==transitionId)return;heroImage.style.opacity='0';setTimeout(()=>{if(request===transitionId)applySlide(next)},180)};
  preload.onerror=()=>{if(request===transitionId&&slides.length>1)showSlide(next+1)};
  preload.src=remoteAsset(slide.src);
  if(preload.complete&&preload.naturalWidth)preload.onload();
  if(manual)restartTimer();
}
document.querySelector('#prevSlide').addEventListener('click',()=>showSlide(currentSlide-1,true));
document.querySelector('#nextSlide').addEventListener('click',()=>showSlide(currentSlide+1,true));
document.addEventListener('visibilitychange',restartTimer);
let touchX=0;document.querySelector('.hero-gallery').addEventListener('touchstart',e=>{touchX=e.changedTouches[0].screenX},{passive:true});document.querySelector('.hero-gallery').addEventListener('touchend',e=>{const delta=e.changedTouches[0].screenX-touchX;if(Math.abs(delta)>45)showSlide(currentSlide+(delta<0?1:-1),true)},{passive:true});

async function loadSettings(){
  try{
    const response=await fetch(`${API}/api/settings`,{cache:'no-store'}),data=await response.json(),s=data.settings||{};
    const setText=(selector,key)=>{if(s[key])document.querySelector(selector).textContent=s[key]};
    setText('#heroEyebrow','heroEyebrow');setText('#heroTitle','heroTitle');setText('#heroAccent','heroAccent');setText('#heroDescription','heroDescription');
    if(s.heroButton)document.querySelector('#heroButton').firstChild.textContent=`${s.heroButton} `;
    setText('#heroLinkText','heroLinkText');
    if(s.instagramUrl){document.querySelector('#instagramOrderLink').href=s.instagramUrl;document.querySelector('#footerInstagram').href=s.instagramUrl}
    autoplay=s.sliderAutoplay!=='false';intervalMs=Math.max(2500,Math.min(15000,Number(s.sliderInterval)||4800));
    if(s.heroSlides){try{const saved=JSON.parse(s.heroSlides);if(Array.isArray(saved)&&saved.some(item=>item?.src))slides=saved.filter(item=>item?.src).slice(0,8)}catch{}}
  }catch(error){console.warn('Settings API unavailable',error)}
  buildDots();applySlide(0);restartTimer();
}

async function loadProducts(){try{const response=await fetch(`${API}/api/products`,{cache:'no-store'}),data=await response.json();if(!response.ok)throw new Error();products=data.products||[];const grid=document.querySelector('.products');if(products.length)grid.innerHTML=products.map((product,index)=>`<article class="product-card ${index%2?'offset-high':'offset-low'}"><button class="product-trigger" data-product="${String(product.name).replaceAll('"','&quot;')}" data-product-id="${product.id}" type="button" ${Number(product.stock)===0?'disabled':''}><span class="product-number">${String(index+1).padStart(2,'0')}</span><img src="${remoteAsset(product.imageUrl)}" alt="${String(product.name).replaceAll('"','&quot;')}">${Number(product.stock)===0?'<span class="stock-badge sold-out">نفد المخزون</span>':''}<span class="product-copy"><strong>${product.name}</strong><small>${product.description||''}</small><i>←</i></span></button></article>`).join('');}catch(error){console.warn('Products API unavailable',error)}}

const dialog=document.querySelector('#orderDialog'),form=document.querySelector('#orderForm'),success=document.querySelector('#orderSuccess');
function setOptions(select,items,placeholder){const choices=items.length?items:['يحدد مع HANON'];select.innerHTML=`<option value="">${placeholder}</option>`+choices.map(item=>`<option value="${String(item).replaceAll('"','&quot;')}">${item}</option>`).join('');select.disabled=false;}
document.querySelector('.products').addEventListener('click',event=>{const button=event.target.closest('.product-trigger');if(!button||button.disabled)return;const productName=button.dataset.product,product=products.find(item=>String(item.id)===button.dataset.productId);document.querySelector('#selectedProduct').value=productName;document.querySelector('#selectedProductId').value=button.dataset.productId||'';document.querySelector('#selectedProductText').textContent=productName;document.querySelector('#selectedProductImage').src=button.querySelector('img').src;document.querySelector('#selectedProductImage').alt=productName;document.querySelector('#dialogTitle').textContent=productName;setOptions(document.querySelector('#color'),parseList(product?.colors),'اختاري اللون');setOptions(document.querySelector('#size'),parseList(product?.sizes),'اختاري المقاس');quantity=1;document.querySelector('#quantity').textContent=quantity;form.hidden=false;success.hidden=true;dialog.showModal();setTimeout(()=>document.querySelector('#instagram').focus(),50)});
document.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});document.querySelector('#minusQty').addEventListener('click',()=>{quantity=Math.max(1,quantity-1);document.querySelector('#quantity').textContent=quantity});document.querySelector('#plusQty').addEventListener('click',()=>{quantity=Math.min(10,quantity+1);document.querySelector('#quantity').textContent=quantity});
form.addEventListener('submit',async event=>{event.preventDefault();const submit=form.querySelector('.submit-order'),original=submit.textContent;submit.disabled=true;submit.textContent='جاري تسجيل الطلب…';try{const response=await fetch(`${API}/api/orders`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId:Number(document.querySelector('#selectedProductId').value),instagram:document.querySelector('#instagram').value,color:document.querySelector('#color').value,size:document.querySelector('#size').value,quantity})}),data=await response.json();if(!response.ok)throw new Error(data.error||'تعذر تسجيل الطلب');document.querySelector('#orderId').textContent=data.order.orderCode;form.hidden=true;success.hidden=false;await loadProducts()}catch(error){alert(error.message)}finally{submit.disabled=false;submit.textContent=original}});

loadSettings();loadProducts();
