/* ========= Helpers ========= */
    const rupiah = n => 'Rp' + (n||0).toLocaleString('id-ID');
    const qs  = s => document.querySelector(s);
    const qsa = s => Array.from(document.querySelectorAll(s));
    const storage = {
      get(k,def){ try{ const v = JSON.parse(localStorage.getItem(k)); return (v===null||v===undefined)?def:v; }catch(e){ return def; } },
      set(k,v){ localStorage.setItem(k, JSON.stringify(v)); },
      del(k){ localStorage.removeItem(k); }
    };

    const BAL_KEY = 'dana_balance';
    const PIN_KEY = 'dana_pin';
    const LOGIN_KEY = 'dana_logged_in';
    const TX_KEY = 'dana_history';

  
document.addEventListener("DOMContentLoaded", () => {
      const slider = document.getElementById("promoSlider");
      const slides = slider.querySelectorAll(".slide");
      let index = 0;
      let startX = 0;
      let isDragging = false;
      let autoSlide;

      function updateSlide() {
        slides.forEach((s, i) => {
          let offset = i - index;

          if (offset < -Math.floor(slides.length / 2)) offset += slides.length;
          if (offset >  Math.floor(slides.length / 2)) offset -= slides.length;

          if (offset === 0) {
            // Tengah
            s.style.transform = "translateX(-50%) scale(1)";
            s.style.opacity = "1";
            s.style.zIndex = "3";
            s.style.boxShadow = "0 6px 18px rgba(0,0,0,0.3)";
          } else if (offset === -1) {
            // Kiri
            s.style.transform = "translateX(-95%) scale(0.85)";
            s.style.opacity = "0.6";
            s.style.zIndex = "2";
            s.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
          } else if (offset === 1) {
            // Kanan
            s.style.transform = "translateX(-5%) scale(0.85)";
            s.style.opacity = "0.6";
            s.style.zIndex = "2";
            s.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
          } else {
            // Lainnya sembunyi
            s.style.transform = `translateX(${offset * 200}%) scale(0.5)`;
            s.style.opacity = "0";
            s.style.zIndex = "1";
            s.style.boxShadow = "none";
          }
        });
      }

      function startAutoSlide() {
        stopAutoSlide();
        autoSlide = setInterval(() => {
          index = (index + 1) % slides.length;
          updateSlide();
        }, 3000);
      }
      function stopAutoSlide() { clearInterval(autoSlide); }

      // Swipe
      slider.addEventListener("touchstart", (e) => {
        stopAutoSlide();
        startX = e.touches[0].clientX;
        isDragging = true;
      });

      slider.addEventListener("touchmove", (e) => {
        if (!isDragging) return;
        let currentX = e.touches[0].clientX;
        let diff = startX - currentX;

        if (diff > 50) {
          index = (index + 1) % slides.length;
          updateSlide();
          isDragging = false;
        } else if (diff < -50) {
          index = (index - 1 + slides.length) % slides.length;
          updateSlide();
          isDragging = false;
        }
      });

      slider.addEventListener("touchend", () => {
        isDragging = false;
        startAutoSlide();
      });

      updateSlide();
      startAutoSlide();
    });

    /* ========= Login / PIN ========= */
    const verifyWrap = document.getElementById('startupVerify');
    const stepPhone  = document.getElementById('verifyStepPhone');
    const stepOTP    = document.getElementById('verifyStepOTP');
    const stepSetPIN = document.getElementById('verifyStepSetPIN');
    const stepPIN    = document.getElementById('verifyStepPIN');
    const MOCK_OTP = '123456';

    function showStep(el){ [stepPhone, stepOTP, stepSetPIN, stepPIN].forEach(x=>x.classList.add('hidden')); el.classList.remove('hidden'); }

    document.getElementById('havePinBtn').addEventListener('click', ()=>{
      const saved = storage.get(PIN_KEY,null);
      if(saved){ showStep(stepPIN); }
      else { alert('Belum ada PIN tersimpan. Silakan buat PIN baru.'); }
    });

    function startupSendOTP(){
      const phone = document.getElementById('startupPhone').value.trim();
      if(!/^0[0-9]{9,13}$/.test(phone)){ alert('Nomor HP tidak valid'); return; }
      alert('OTP dikirim ke '+phone+' (demo gunakan '+MOCK_OTP+')');
      showStep(stepOTP);
    }
    function startupResendOTP(){ alert('OTP baru terkirim (demo: '+MOCK_OTP+')'); }
    function startupVerifyOTP(){
      const otp = document.getElementById('startupOTP').value.trim();
      if(otp===MOCK_OTP){ showStep(stepSetPIN); }
      else alert('OTP salah');
    }
    function startupSavePIN(){
      const p1 = document.getElementById('startupSetPIN1').value.trim();
      const p2 = document.getElementById('startupSetPIN2').value.trim();
      if(!/^[0-9]{6}$/.test(p1)){ alert('PIN harus 6 digit'); return; }
      if(p1!==p2){ alert('PIN tidak sama'); return; }
      storage.set(PIN_KEY, p1);
      storage.set(LOGIN_KEY, true);
      verifyWrap.style.display = 'none';
      initAfterLogin();
    }
    function startupVerifyPIN(){
      const pin = document.getElementById('startupPIN').value.trim();
      const saved = storage.get(PIN_KEY,null);
      if(saved && pin===saved){
        storage.set(LOGIN_KEY,true);
        verifyWrap.style.display='none';
        initAfterLogin();
      }else alert('PIN salah');
    }
    window.startupSendOTP = startupSendOTP;
    window.startupResendOTP = startupResendOTP;
    window.startupVerifyOTP = startupVerifyOTP;
    window.startupSavePIN = startupSavePIN;
    window.startupVerifyPIN = startupVerifyPIN;

    // lock scroll while verify
    (function(){
      const main = document.getElementById('mainScroll');
      const obs = new MutationObserver(()=>{ if(verifyWrap.style.display==='none') main.style.overflow='auto'; else main.style.overflow='hidden'; });
      obs.observe(verifyWrap,{attributes:true, attributeFilter:['style']});
      if(verifyWrap.style.display!=='none') main.style.overflow='hidden';
    })();

    function logout(){
      storage.set(LOGIN_KEY,false); // sesi berakhir, PIN tetap
      verifyWrap.style.display='flex';
      showStep(stepPIN);
    }

    // Balance init
    function initBalance(){
      let b = storage.get(BAL_KEY, null);
      if(b===null){ b = 1487500; storage.set(BAL_KEY,b); }
      document.getElementById('balance').innerText = b.toLocaleString('id-ID');
    }

    function initAfterLogin(){
      initBalance();
      renderHistory(); // refresh aktivitas
    }

    // boot
    (function boot(){
      if(storage.get(LOGIN_KEY,false)){ verifyWrap.style.display='none'; initAfterLogin(); }
      else { verifyWrap.style.display='flex'; const hasPin = storage.get(PIN_KEY,null); showStep(hasPin?stepPIN:stepPhone); }
    })();

    /* ========= Bottom Nav Tabs ========= */
    const sections = {
      tabHome: 'homeSection',
      tabAktivitas: 'activitySection',
      tabPay: 'paySection',
      tabWallet: 'walletSection'
    };
    Object.keys(sections).forEach(tabId=>{
      const btn = document.getElementById(tabId);
      btn.addEventListener('click', ()=>{
        // protect: require login
        if(verifyWrap.style.display !== 'none'){ alert('Silakan verifikasi terlebih dahulu.'); return; }
        // toggle active
        qsa('.bottom-nav button').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
        // show section
        Object.values(sections).forEach(id=> qs('#'+id).classList.add('hidden'));
        qs('#'+sections[tabId]).classList.remove('hidden');
      });
    });
    document.getElementById('tabLogout').addEventListener('click', ()=>{
      if(confirm('Yakin ingin logout?')) logout();
    });

    /* ========= Proteksi klik fitur sebelum login ========= */
    const protectIds = ["topUpBtn","withdrawBtn","pulsaDataBtn","listrikBtn","googlePlayBtn","topUpGameBtn","dagetBtn","dataPlusBtn","sendMoneyBtn","qrPayBtn","danaPolyBtn","rewardBtn","danaDealsBtn"];
    protectIds.forEach(id=>{
      const el = document.getElementById(id);
      if(!el) return;
      el.addEventListener('click', (e)=>{
        if(verifyWrap.style.display !== 'none'){ e.preventDefault(); alert('Silakan verifikasi terlebih dahulu.'); }
      });
    });

    /* ========= SHEET Controls ========= */
const pulsaSheet    = document.getElementById('pulsaSheet');
const listrikSheet    = document.getElementById('listrikSheet');
const topUpGameSheet  = document.getElementById('topUpGameSheet');
const davigoGameSheet = document.getElementById('davigoGameSheet'); // NEW

document.getElementById('pulsaDataBtn').addEventListener('click', ()=> openSheet(pulsaSheet));
document.getElementById('listrikBtn').addEventListener('click', ()=> openSheet(listrikSheet));
document.getElementById('topUpGameBtn').addEventListener('click', ()=> openSheet(topUpGameSheet));
document.getElementById('davigoPointBtn').addEventListener('click', ()=> openSheet(davigoGameSheet)); // NEW

function openSheet(el){ el.classList.add('open'); }
function closeSheet(el){ el.classList.remove('open'); }

// ESC buat nutup semua sheet
document.addEventListener('keydown', (e)=>{ 
  if(e.key==='Escape'){ 
    closeSheet(pulsaSheet); 
    closeSheet(listrikSheet);
    closeSheet(topUpGameSheet);
    closeSheet(davigoGameSheet); // NEW
  }
});

const davigoPointSheet = document.getElementById('davigoPointSheet');

document.getElementById('davigoPointBtn')
  .addEventListener('click', ()=> openSheet(davigoPointSheet));

document.addEventListener('keydown', (e)=>{ 
  if(e.key==='Escape'){ 
    closeSheet(davigoPointSheet);
  }
});

    /* ========= Pulsa/Data Logic ========= */
    const pulsaProducts = [
      // nominal, harga, diskon (rupiah), label
      {nominal:'5.000',  harga:6000,  diskon:500,  label:'Pulsa 5K'},
      {nominal:'10.000', harga:11000, diskon:1000, label:'Pulsa 10K'},
      {nominal:'15.000', harga:16000, diskon:1500, label:'Pulsa 15K'},
      {nominal:'20.000', harga:21000, diskon:2000, label:'Pulsa 20K'},
      {nominal:'25.000', harga:26000, diskon:2500, label:'Pulsa 25K'},
      {nominal:'30.000', harga:31000, diskon:3000, label:'Pulsa 30K'},
      {nominal:'40.000', harga:41000, diskon:3500, label:'Pulsa 40K'},
      {nominal:'50.000', harga:51000, diskon:4000, label:'Pulsa 50K'},
      {nominal:'75.000', harga:76000, diskon:5000, label:'Pulsa 75K'},
      {nominal:'100.000',harga:101000,diskon:7000, label:'Pulsa 100K'},
      // paket data contoh
      {nominal:'Data 2GB/7hr',  harga:15000, diskon:2000, label:'Paket Data'},
      {nominal:'Data 5GB/15hr', harga:35000, diskon:5000, label:'Paket Data'},
      {nominal:'Data 10GB/30hr',harga:65000, diskon:8000, label:'Paket Data'},
    ];

    const pulsaGrid = document.getElementById('pulsaGrid');
    let pulsaSelected = null;

    function renderPulsaGrid(){
      pulsaGrid.innerHTML = '';
      pulsaProducts.forEach((p,i)=>{
        const div = document.createElement('div');
        div.className = 'price-card';
        div.innerHTML = `
          <div class="text-sm font-semibold">${p.label.includes('Data')?p.label:('Pulsa')}</div>
          <div class="text-xs text-gray-600">${p.nominal}</div>
          <div class="flex items-center justify-between mt-1">
            <div class="text-sm font-semibold">${rupiah(p.harga - p.diskon)}</div>
            <span class="pill">- ${rupiah(p.diskon)}</span>
          </div>`;
        div.addEventListener('click',()=>{
          pulsaSelected = i;
          qsa('#pulsaGrid .price-card').forEach(x=>x.classList.remove('active'));
          div.classList.add('active');
          updatePulsaSummary();
        });
        pulsaGrid.appendChild(div);
      });
    }
    renderPulsaGrid();

    function updatePulsaSummary(){
      const sum = document.getElementById('pulsaSummary');
      if(pulsaSelected===null){ sum.classList.add('hidden'); return; }
      const p = pulsaProducts[pulsaSelected];
      document.getElementById('pulsaHarga').innerText  = rupiah(p.harga);
      document.getElementById('pulsaDiskon').innerText = '- ' + rupiah(p.diskon);
      document.getElementById('pulsaTotal').innerText  = rupiah(p.harga - p.diskon);
      sum.classList.remove('hidden');
    }

    document.getElementById('pulsaReset').addEventListener('click', ()=>{
      pulsaSelected=null; qsa('#pulsaGrid .price-card').forEach(x=>x.classList.remove('active'));
      document.getElementById('pulsaSummary').classList.add('hidden');
      document.getElementById('pulsaPhone').value='';
    });

    document.getElementById('pulsaBayar').addEventListener('click', ()=>{
      const phone = document.getElementById('pulsaPhone').value.trim();
      if(!/^0[0-9]{9,13}$/.test(phone)){ alert('Nomor HP tidak valid'); return; }
      if(pulsaSelected===null){ alert('Pilih nominal dulu'); return; }
      const p = pulsaProducts[pulsaSelected];
      const total = p.harga - p.diskon;
      let bal = storage.get(BAL_KEY,0);
      if(bal < total){ alert('Saldo tidak cukup'); return; }
      bal -= total; storage.set(BAL_KEY,bal); document.getElementById('balance').innerText = bal.toLocaleString('id-ID');

      // tambah history
      const tx = storage.get(TX_KEY,[]);
      tx.unshift({
        id:'TXN'+Date.now(),
        ts: new Date().toISOString(),
        type:'pulsa',
        target: phone,
        nominal: p.nominal,
        harga: p.harga,
        diskon: p.diskon,
        total: total,
        status:'Sukses'
      });
      storage.set(TX_KEY, tx);
      renderHistory();

      alert('Pembelian '+p.label+' '+p.nominal+' untuk '+phone+' berhasil.\nTotal: '+rupiah(total));
      closeSheet(pulsaSheet);
      // reset pilihan
      document.getElementById('pulsaReset').click();
    });
document.querySelectorAll('.closeSheetBtn, .close-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const sheet = btn.closest('.sheet');
    closeSheet(sheet);
  });
});

    /* ========= Listrik Logic ========= */
    const plnProducts = [
      {nominal:'Token 5.000',      harga:5000,     admin:2000, diskon:500},
  {nominal:'Token 10.000',     harga:10000,    admin:2000, diskon:800},
  {nominal:'Token 20.000',     harga:20000,    admin:2500, diskon:1000},
  {nominal:'Token 50.000',     harga:50000,    admin:2500, diskon:2000},
  {nominal:'Token 100.000',    harga:100000,   admin:2500, diskon:3000},
  {nominal:'Token 200.000',    harga:200000,   admin:3000, diskon:5000},
  {nominal:'Token 250.000',    harga:250000,   admin:3000, diskon:6000},
  {nominal:'Token 300.000',    harga:300000,   admin:3000, diskon:7000},
  {nominal:'Token 500.000',    harga:500000,   admin:3000, diskon:10000},
  {nominal:'Token 750.000',    harga:750000,   admin:4000, diskon:15000},
  {nominal:'Token 1.000.000',  harga:1000000,  admin:5000, diskon:20000},
  {nominal:'Token 1.500.000',  harga:1500000,  admin:6000, diskon:30000},
  {nominal:'Token 2.000.000',  harga:2000000,  admin:7000, diskon:40000},
  {nominal:'Token 5.000.000',  harga:5000000,  admin:10000, diskon:100000}, 
    ];
    const plnGrid = document.getElementById('plnGrid');
    let plnSelected = null;

    function renderPlnGrid(){
      plnGrid.innerHTML='';
      plnProducts.forEach((p,i)=>{
        const div = document.createElement('div');
        div.className='price-card';
        div.innerHTML = `
          <div class="text-sm font-semibold">Prabayar</div>
          <div class="text-xs text-gray-600">${p.nominal}</div>
          <div class="flex items-center justify-between mt-1">
            <div class="text-sm font-semibold">${rupiah(p.harga + p.admin - p.diskon)}</div>
            <span class="pill">- ${rupiah(p.diskon)}</span>
          </div>`;
        div.addEventListener('click',()=>{
          plnSelected=i;
          qsa('#plnGrid .price-card').forEach(x=>x.classList.remove('active'));
          div.classList.add('active');
          updatePlnSummary();
        });
        plnGrid.appendChild(div);
      });
    }
    renderPlnGrid();

    function fakePlnInquiry(id){
      // Demo data
      const names = ['BUDI','SITI','ANDI','NUR','INTAN','RIZKY'];
      const dayaList = ['900 VA','1300 VA','2200 VA','3500 VA'];
      return {
        nama: names[id.length % names.length] + ' ' + id.slice(-3),
        daya: dayaList[id.length % dayaList.length]
      };
    }

    document.getElementById('plnId').addEventListener('input', (e)=>{
      const id = e.target.value.trim();
      const info = document.getElementById('plnInfo');
      if(/^[0-9]{10,13}$/.test(id)){
        const res = fakePlnInquiry(id);
        document.getElementById('plnNama').innerText = res.nama;
        document.getElementById('plnDaya').innerText = res.daya;
        info.classList.remove('hidden');
      }else{
        info.classList.add('hidden');
      }
    });

    function updatePlnSummary(){
      const sum = document.getElementById('plnSummary');
      if(plnSelected===null){ sum.classList.add('hidden'); return; }
      const p = plnProducts[plnSelected];
      const total = p.harga + p.admin - p.diskon;
      document.getElementById('plnHarga').innerText  = rupiah(p.harga);
      document.getElementById('plnAdmin').innerText  = rupiah(p.admin);
      document.getElementById('plnDiskon').innerText = '- ' + rupiah(p.diskon);
      document.getElementById('plnTotal').innerText  = rupiah(total);
      sum.classList.remove('hidden');
    }

    document.getElementById('plnReset').addEventListener('click', ()=>{
      plnSelected=null; qsa('#plnGrid .price-card').forEach(x=>x.classList.remove('active'));
      document.getElementById('plnSummary').classList.add('hidden');
      document.getElementById('plnId').value=''; document.getElementById('plnInfo').classList.add('hidden');
    });

    document.getElementById('plnBayar').addEventListener('click', ()=>{
      const idpel = document.getElementById('plnId').value.trim();
      if(!/^[0-9]{10,13}$/.test(idpel)){ alert('ID pelanggan / No. meter tidak valid'); return; }
      if(plnSelected===null){ alert('Pilih nominal token dahulu'); return; }
      const p = plnProducts[plnSelected];
      const total = p.harga + p.admin - p.diskon;
      let bal = storage.get(BAL_KEY,0);
      if(bal < total){ alert('Saldo tidak cukup'); return; }
      bal -= total; storage.set(BAL_KEY,bal); document.getElementById('balance').innerText = bal.toLocaleString('id-ID');

      const inq = fakePlnInquiry(idpel);

      // simpan history
      const tx = storage.get(TX_KEY,[]);
      tx.unshift({
        id:'TXN'+Date.now(),
        ts: new Date().toISOString(),
        type:'listrik',
        target: idpel,
        nama: inq.nama,
        daya: inq.daya,
        nominal: p.nominal,
        harga: p.harga,
        admin: p.admin,
        diskon: p.diskon,
        total: total,
        status:'Sukses',
        token: 'TKN-'+Math.random().toString(36).slice(2,10).toUpperCase()
      });
      storage.set(TX_KEY, tx);
      renderHistory();

      alert('Pembelian '+p.nominal+' untuk '+idpel+' berhasil.\nToken akan ditampilkan di Aktivitas.\nTotal: '+rupiah(total));
      closeSheet(listrikSheet);
      // reset
      document.getElementById('plnReset').click();
    });
document.querySelectorAll('.closeSheetBtn, .close-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const sheet = btn.closest('.sheet');
    closeSheet(sheet);
  });
});





/* ========= Top Up Game Logic ========= */
const gameProducts = [
// Free Fire
{game:'ff', nominal:'Diamond 50',   harga:10000,  diskon:1000, label:'Free Fire', icon:'💎'},
{game:'ff', nominal:'Diamond 100',  harga:20000,  diskon:2000, label:'Free Fire', icon:'💎'},
{game:'ff', nominal:'Diamond 310',  harga:60000,  diskon:5000, label:'Free Fire', icon:'💎'},
{game:'ff', nominal:'Diamond 520',  harga:95000,  diskon:8000, label:'Free Fire', icon:'💎'},
{game:'ff', nominal:'Diamond 1060', harga:185000, diskon:15000, label:'Free Fire', icon:'💎'},

{game:'ff', nominal:'Elite Pass',   harga:120000, diskon:10000, label:'Free Fire', icon:'🎫'},
{game:'ff', nominal:'Membership Mingguan', harga:25000,  diskon:3000,  label:'Free Fire', icon:'⭐'},
{game:'ff', nominal:'Membership Bulanan',  harga:60000,  diskon:5000,  label:'Free Fire', icon:'⭐'},

{game:'ff', nominal:'Special Bundle', harga:150000, diskon:12000, label:'Free Fire', icon:'🎁'},

// ========== MOBILE LEGENDS ==========
{game:'ml', nominal:'Diamond 86',   harga:16000,  diskon:1500, label:'MLBB', icon:'💎'},
{game:'ml', nominal:'Diamond 172',  harga:32000,  diskon:3000, label:'MLBB', icon:'💎'},
{game:'ml', nominal:'Diamond 257',  harga:48000,  diskon:4000, label:'MLBB', icon:'💎'},
{game:'ml', nominal:'Diamond 344',  harga:64000,  diskon:5500, label:'MLBB', icon:'💎'},
{game:'ml', nominal:'Diamond 429',  harga:80000,  diskon:7000, label:'MLBB', icon:'💎'},
{game:'ml', nominal:'Diamond 514',  harga:96000,  diskon:8500, label:'MLBB', icon:'💎'},
{game:'ml', nominal:'Diamond 706',  harga:132000, diskon:12000,label:'MLBB', icon:'💎'},
{game:'ml', nominal:'Starlight Member', harga:150000, diskon:12000,label:'MLBB', icon:'🌟'},
{game:'ml', nominal:'Twilight Pass',    harga:200000, diskon:20000,label:'MLBB', icon:'🎟️'},

// ========== PUBG ==========
{game:'pubg', nominal:'UC 60',     harga:12000,   diskon:1000, label:'PUBG', icon:'🎯'},
{game:'pubg', nominal:'UC 325',    harga:65000,   diskon:5000, label:'PUBG', icon:'🎯'},
{game:'pubg', nominal:'UC 660',    harga:125000,  diskon:9000, label:'PUBG', icon:'🎯'},
{game:'pubg', nominal:'UC 1800',   harga:330000,  diskon:25000,label:'PUBG', icon:'🎯'},
{game:'pubg', nominal:'UC 3850',   harga:660000,  diskon:50000,label:'PUBG', icon:'🎯'},
{game:'pubg', nominal:'UC 8100',   harga:1320000, diskon:90000,label:'PUBG', icon:'🎯'},
{game:'pubg', nominal:'Elite Pass Plus', harga:200000, diskon:15000,label:'PUBG', icon:'🎟️'},

// ========== CALL OF DUTY MOBILE ==========
{game:'cod', nominal:'CP 80',    harga:15000,   diskon:1500, label:'CODM', icon:'💣'},
{game:'cod', nominal:'CP 420',   harga:75000,   diskon:6000, label:'CODM', icon:'💣'},
{game:'cod', nominal:'CP 880',   harga:155000,  diskon:12000,label:'CODM', icon:'💣'},
{game:'cod', nominal:'CP 2400',  harga:420000,  diskon:30000,label:'CODM', icon:'💣'},
{game:'cod', nominal:'CP 5000',  harga:850000,  diskon:60000,label:'CODM', icon:'💣'},
{game:'cod', nominal:'CP 10000', harga:1650000, diskon:120000,label:'CODM', icon:'💣'},
{game:'cod', nominal:'Battle Pass', harga:170000, diskon:12000,label:'CODM', icon:'🎟️'},

// ========== CLASH OF CLANS ==========
{game:'coc', nominal:'Gem 500',   harga:50000,  diskon:4000, label:'COC', icon:'💎'},
{game:'coc', nominal:'Gem 1200',  harga:120000, diskon:9000, label:'COC', icon:'💎'},
{game:'coc', nominal:'Gem 2500',  harga:250000, diskon:20000,label:'COC', icon:'💎'},
{game:'coc', nominal:'Gem 6500',  harga:650000, diskon:50000,label:'COC', icon:'💎'},
{game:'coc', nominal:'Gem 14000', harga:1350000,diskon:100000,label:'COC', icon:'💎'},
{game:'coc', nominal:'Gold Pass', harga:75000,  diskon:6000, label:'COC', icon:'🎟️'},

// ========== AMONG US ==========
{game:'among', nominal:'Stars 20',  harga:10000,  diskon:800,  label:'Among Us', icon:'⭐'},
{game:'among', nominal:'Stars 50',  harga:25000,  diskon:2000, label:'Among Us', icon:'⭐'},
{game:'among', nominal:'Stars 100', harga:48000,  diskon:4000, label:'Among Us', icon:'⭐'},
{game:'among', nominal:'Stars 250', harga:115000, diskon:9000, label:'Among Us', icon:'⭐'},
{game:'among', nominal:'Stars 500', harga:230000, diskon:18000,label:'Among Us', icon:'⭐'},

// ========== ROBLOX ==========
{game:'roblox', nominal:'Robux 400',  harga:60000,  diskon:5000,  label:'Roblox', icon:'🟦'},
{game:'roblox', nominal:'Robux 800',  harga:115000, diskon:9000,  label:'Roblox', icon:'🟦'},
{game:'roblox', nominal:'Robux 1700', harga:240000, diskon:18000, label:'Roblox', icon:'🟦'},
{game:'roblox', nominal:'Robux 4500', harga:630000, diskon:48000, label:'Roblox', icon:'🟦'},
{game:'roblox', nominal:'Robux 10000',harga:1350000,diskon:100000,label:'Roblox', icon:'🟦'},
{game:'roblox', nominal:'Premium 1 Bulan', harga:120000, diskon:10000,label:'Roblox', icon:'⭐'},
{game:'roblox', nominal:'Premium 3 Bulan', harga:350000, diskon:30000,label:'Roblox', icon:'⭐'},
];

const gameGrid = document.getElementById('gameGrid');
let gameSelected = null; // simpan object produk yang dipilih

// render daftar harga sesuai game
function renderGameGrid(gameKey){
  gameGrid.innerHTML = '';
  gameProducts
    .filter(p => p.game === gameKey) // filter sesuai game dipilih
    .forEach((p,i)=>{
      const div = document.createElement('div');
      div.className = 'price-card';
      div.innerHTML = `
        <div class="text-sm font-semibold flex items-center gap-1">
          <span>${p.icon || ''}</span> ${p.label}
        </div>
        <div class="text-xs text-gray-600">${p.nominal}</div>
        <div class="flex items-center justify-between mt-1">
          <div class="text-sm font-semibold">${rupiah(p.harga - p.diskon)}</div>
          <span class="pill">- ${rupiah(p.diskon)}</span>
        </div>`;
      div.addEventListener('click',()=>{
        gameSelected = p; // simpan langsung object produk
        qsa('#gameGrid .price-card').forEach(x=>x.classList.remove('active'));
        div.classList.add('active');
        updateGameSummary();
      });
      gameGrid.appendChild(div);
    });
}

function updateGameSummary(){
  const sum = document.getElementById('gameSummary');
  if(!gameSelected){ 
    sum.classList.add('hidden'); 
    return; 
  }
  document.getElementById('gameHarga').innerText  = rupiah(gameSelected.harga);
  document.getElementById('gameDiskon').innerText = '- ' + rupiah(gameSelected.diskon);
  document.getElementById('gameTotal').innerText  = rupiah(gameSelected.harga - gameSelected.diskon);
  sum.classList.remove('hidden');
}

// reset
document.getElementById('gameReset').addEventListener('click', ()=>{
  gameSelected=null; 
  qsa('#gameGrid .price-card').forEach(x=>x.classList.remove('active'));
  document.getElementById('gameSummary').classList.add('hidden');
  document.getElementById('gameUserId').value='';
});

// bayar
document.getElementById('gameBayar').addEventListener('click', ()=>{
  const userId = document.getElementById('gameUserId').value.trim();
  if(userId.length < 3){ alert('User ID tidak valid'); return; }
  if(!gameSelected){ alert('Pilih paket dulu'); return; }

  const total = gameSelected.harga - gameSelected.diskon;
  let bal = storage.get(BAL_KEY,0);
  if(bal < total){ alert('Saldo tidak cukup'); return; }
  bal -= total; 
  storage.set(BAL_KEY,bal); 
  document.getElementById('balance').innerText = bal.toLocaleString('id-ID');

  // simpan history
  const tx = storage.get(TX_KEY,[]);
  tx.unshift({
    id:'TXN'+Date.now(),
    ts: new Date().toISOString(),
    type:'game',
    target: userId,
    nominal: gameSelected.nominal,
    label: gameSelected.label,
    harga: gameSelected.harga,
    diskon: gameSelected.diskon,
    total: total,
    status:'Sukses'
  });
  storage.set(TX_KEY, tx);
  renderHistory();

  alert('Top Up '+gameSelected.label+' '+gameSelected.nominal+' untuk ID '+userId+' berhasil.\nTotal: '+rupiah(total));
  closeSheet(document.getElementById('topUpGameSheet'));
  document.getElementById('gameReset').click();
});

// mapping logo + label
const gameLogos = {
  ff:     {label: "Free Fire", logo: "https://raw.githubusercontent.com/dfandrn/Gambar/main/Screenshot_2025-09-06-21-02-28-07_680d03679600f7af0b4c700c6b270fe7.jpg"},
  ml:     {label: "Mobile Legends", logo: "https://raw.githubusercontent.com/dfandrn/danar/main/Screenshot_2025-09-06-16-31-08-05_680d03679600f7af0b4c700c6b270fe7.jpg"},
  pubg:   {label: "PUBG", logo: "https://raw.githubusercontent.com/dfandrn/Gambar/main/Picsart_25-09-07_09-47-15-149.jpg"},
  cod:    {label: "Call of Duty", logo: "https://raw.githubusercontent.com/dfandrn/danar/main/Screenshot_2025-09-06-16-29-51-71_680d03679600f7af0b4c700c6b270fe7.jpg"},
  coc:    {label: "Clash of Clans", logo: "https://raw.githubusercontent.com/dfandrn/danar/main/Screenshot_2025-09-06-16-27-30-40_680d03679600f7af0b4c700c6b270fe7.jpg"},
  among:  {label: "Among Us", logo: "https://raw.githubusercontent.com/dfandrn/danar/main/Screenshot_2025-09-06-16-28-25-32_680d03679600f7af0b4c700c6b270fe7.jpg"},
  roblox: {label: "Roblox", logo: "https://raw.githubusercontent.com/dfandrn/danar/main/Screenshot_2025-09-06-16-27-02-38_680d03679600f7af0b4c700c6b270fe7.jpg"}
};

let selectedGame = null;

// pilih game
qsa('#gameList .game-card').forEach(card => {
  card.addEventListener('click', ()=>{
    selectedGame = card.dataset.game;

    // tampilkan logo
    document.getElementById('selectedGame').classList.remove('hidden');
    document.getElementById('gameLogo').src = gameLogos[selectedGame].logo;

    // filter product sesuai game
    renderGameGrid(selectedGame);
  });
});

// tombol close sheet
document.querySelectorAll('.closeSheetBtn, .close-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const sheet = btn.closest('.sheet');
    closeSheet(sheet);
  });
});


/* ========= Render Game List ========= */
function renderGameList() {
  const list = document.getElementById('gameList');
  list.innerHTML = '';

  Object.entries(gameLogos).forEach(([key, g]) => {
    const card = document.createElement('div');
    card.className = 'game-card cursor-pointer';
    card.dataset.game = key;
    card.innerHTML = `
      <img src="${g.logo}" alt="${g.label}" 
           class="w-12 h-12 mx-auto rounded-full object-cover border border-gray-200 shadow-sm">
      <span class="text-sm font-medium block text-center mt-1">${g.label}</span>
    `;
    list.appendChild(card);
  });

  // klik kartu game
  qsa('#gameList .game-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedGame = card.dataset.game;
      document.getElementById('selectedGame').classList.remove('hidden');
      document.getElementById('gameLogo').src = gameLogos[selectedGame].logo;
      renderGameGrid(selectedGame);
    });
  });
}

// panggil sekali saat load
renderGameList();


/* riwayat trx */
function renderHistory(){
  const list = document.getElementById('txnList');
  const empty = document.getElementById('emptyTxn');
  const summary = document.getElementById('txnSummary');
  const txs = storage.get(TX_KEY,[]);

  list.innerHTML = '';
  summary.innerHTML = '';

  if(!txs.length){ 
    empty.classList.remove('hidden'); 
    summary.innerHTML = '';
    return; 
  }
  empty.classList.add('hidden');

  // Hitung total pengeluaran bulan ini
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const txsThisMonth = txs.filter(tx=>{
    const d = new Date(tx.ts);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalThisMonth = txsThisMonth.reduce((acc,tx)=>acc+tx.total,0);
  summary.innerHTML = `Bulan ini habis <span class="text-green-600 font-bold">${rupiah(totalThisMonth)}</span> dari ${txsThisMonth.length} transaksi`;

  // Group transaksi berdasarkan tanggal (yyyy-mm-dd)
  const grouped = {};
  txs.slice(0,100).forEach(tx=>{
    const d = new Date(tx.ts);
    const key = d.toISOString().slice(0,10);
    if(!grouped[key]) grouped[key] = [];
    grouped[key].push(tx);
  });

  // Sort tanggal descending
  const sortedDates = Object.keys(grouped).sort((a,b)=>b.localeCompare(a));

  sortedDates.forEach(dateStr=>{
    const dateObj = new Date(dateStr);
    const isToday = isSameDate(dateObj, now);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate()-1);
    const isYesterday = isSameDate(dateObj, yesterday);

    let labelDate = '';
    if(isToday) labelDate = 'Hari ini';
    else if(isYesterday) labelDate = 'Kemarin';
    else labelDate = dateObj.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

    const dateHeader = document.createElement('div');
    dateHeader.className = 'date-header sticky top-0 bg-white py-2 px-4 font-semibold text-gray-700 border-b border-gray-300';
    dateHeader.textContent = labelDate;
    list.appendChild(dateHeader);

    grouped[dateStr].forEach(tx=>{
      const row = document.createElement('div');
      row.className='txn-item cursor-pointer p-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition';

      const icon = document.createElement('div');
      icon.className = 'txn-icon flex-shrink-0 mr-4 flex items-center justify-center rounded-full w-12 h-12 bg-gray-100';
      icon.innerHTML = getIconSVG(tx.type);
      row.appendChild(icon);

      const left = document.createElement('div');
      left.className = 'flex-grow';
      left.innerHTML = `
        <div class="font-semibold text-gray-900 text-base">${
          tx.type==='pulsa'   ? 'Pulsa/Data' :
          tx.type==='listrik' ? 'Listrik' :
          tx.type==='game'    ? 'Top Up Game' :
          tx.type==='gplay'   ? 'Google Play Voucher' :
          'Transaksi'
        }</div>
        <div class="text-xs text-gray-500 mt-1">${tx.target}</div>
        <div class="text-xs text-gray-400 mt-0.5">${tx.nominal}${tx.token ? ' • Token: <span class="font-mono">'+tx.token+'</span>':''}</div>
      `;

      const right = document.createElement('div');
      right.className='text-right flex flex-col items-end justify-center min-w-[110px]';
      right.innerHTML = `
        <div class="font-semibold text-green-600 text-base">${rupiah(tx.total)}</div>
        <div class="badge mt-1 px-3 py-0.5 rounded-full text-xs font-semibold ${
          tx.status.toLowerCase() === 'berhasil' ? 'bg-green-100 text-green-800' :
          tx.status.toLowerCase() === 'gagal' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }">${tx.status}</div>
      `;

      row.appendChild(left);
      row.appendChild(right);

      row.addEventListener('click', ()=>showTxnDetail(tx));

      list.appendChild(row);
    });
  });
}

function isSameDate(d1, d2){
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function showTxnDetail(tx){
  const modal = document.createElement('div');
  modal.className = "fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm";
  modal.innerHTML = `
    <div class="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 relative font-sans">
      <button class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold" id="closeModal" aria-label="Close modal">×</button>
      <h2 class="text-2xl font-bold mb-6 text-gray-900">Detail Transaksi</h2>
      <div class="space-y-4 text-gray-700 text-sm">
        <div><span class="font-semibold">Jenis:</span> ${
          tx.type==='pulsa'   ? 'Pulsa/Data' :
          tx.type==='listrik' ? 'Listrik' :
          tx.type==='game'    ? 'Top Up Game' :
          tx.type==='gplay'   ? 'Google Play Voucher' :
          'Transaksi'
        }</div>
        <div><span class="font-semibold">Tanggal:</span> ${new Date(tx.ts).toLocaleString('id-ID')}</div>
        <div><span class="font-semibold">Nomor/Target:</span> ${tx.target}</div>
        <div><span class="font-semibold">Nominal:</span> ${tx.nominal}</div>
        ${tx.token ? `<div><span class="font-semibold">Token:</span> <span class="font-mono bg-gray-100 px-2 py-1 rounded">${tx.token}</span></div>` : ''}
        <div><span class="font-semibold">Total:</span> <span class="text-green-600 font-bold">${rupiah(tx.total)}</span></div>
        <div><span class="font-semibold">Status:</span> <span class="badge px-3 py-1 rounded-full text-sm font-semibold ${
          tx.status.toLowerCase() === 'berhasil' ? 'bg-green-100 text-green-800' :
          tx.status.toLowerCase() === 'gagal' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }">${tx.status}</span></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);

  modal.querySelector('#closeModal').addEventListener('click', ()=>modal.remove());
  modal.addEventListener('click', e=>{
    if(e.target===modal) modal.remove();
  });
}


// Optional: function to return SVG icons based on tx.type
function getIconSVG(type){
  switch(type){
    case 'pulsa': return `<svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M5 12h14"/></svg>`;
    case 'listrik': return `<svg class="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
    case 'game': return `<svg class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>`;
    case 'gplay': return `<svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12l-18 7V5l18 7z"/></svg>`;
    default: return `<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;
  }
}


/* ========= TopUp ========= */
/* ========= Overlay Elements ========= */
const overlayPay = qs('#overlaySuma');
const closePay   = qs('#close');

/* ========= Buka Overlay ========= */
function openOverlay(type){
  overlayPay.classList.remove('hidden');
  overlayPay.classList.add('flex');
  overlayPay.dataset.action = type; // simpan info (topup/withdraw)
}

/* ========= Tutup Overlay ========= */
closePay.addEventListener('click', () => {
  overlayPay.classList.add('hidden');
  overlayPay.classList.remove('flex');
});

/* ========= Trigger khusus ========= */
qs('#topUpBtn').addEventListener('click', ()=> openOverlay('topup'));
qs('#withdrawBtn').addEventListener('click', ()=> openOverlay('withdraw'));

/* ========= Klik Metode Pembayaran ========= */
qsa('.pay-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const method = btn.innerText;
    const action = overlayPay.dataset.action;

    const v = prompt(`Masukkan nominal untuk ${action.toUpperCase()} via ${method}:`, "50000");
    const n = parseInt((v||'').replace(/\D/g,''),10);
    if(!n) return;

    let bal = storage.get(BAL_KEY, 0);

    if(action === 'topup'){
      bal += n;
      storage.set(BAL_KEY, bal);
      qs('#balance').innerText = bal.toLocaleString('id-ID');
      alert(`Top up berhasil via ${method}: ${rupiah(n)}`);
    } else {
      if(bal < n){
        alert('Saldo tidak cukup');
        return;
      }
      bal -= n;
      storage.set(BAL_KEY, bal);
      qs('#balance').innerText = bal.toLocaleString('id-ID');
      alert(`Tarik saldo berhasil via ${method}: ${rupiah(n)}`);
    }

    overlayPay.classList.add('hidden');
    overlayPay.classList.remove('flex');
  });
});



/*style silent Saldo*/
const balanceEl = document.getElementById("balance");
  const toggleBtn = document.getElementById("toggleSaldoBtn");
  const eyeIcon = document.getElementById("eyeIcon");

  let hidden = false;

  toggleBtn.addEventListener("click", () => {
    hidden = !hidden;
    if (hidden) {
      balanceEl.dataset.real = balanceEl.textContent;
      balanceEl.textContent = "•••••••";
      eyeIcon.innerHTML =
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a21.8 21.8 0 0 1 5.06-6.94M22.94 12a21.8 21.8 0 0 0-5.06-6.94M14.12 14.12A3 3 0 0 1 9.88 9.88"/>';
    } else {
      balanceEl.textContent = balanceEl.dataset.real || "130.500";
      eyeIcon.innerHTML =
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />';
    }
  });

// ===== Utils (khusus saldo) =====
const SALDO_KEY = "app_saldo_value"; // nama unik, ga akan nabrak
const saldoStorage = {
  get: (key, def=0) => parseInt(localStorage.getItem(key) || def, 10),
  set: (key, val) => localStorage.setItem(key, val)
};

// ===== Refresh Saldo =====
document.getElementById("refreshSaldoBtn").addEventListener("click", ()=>{
  // ambil saldo terakhir dari storage (default 0)
  const bal = saldoStorage.get(SALDO_KEY, 0);

  // update tampilan
  document.getElementById("balance").textContent = bal.toLocaleString("id-ID");

  // feedback
  alert("Saldo berhasil diperbarui!");
});


// ===== Refresh Saldo =====
document.getElementById("refreshSaldoBtn").addEventListener("click", ()=>{
  // ambil saldo terakhir dari storage (default 0)
  const bal = storage.get(BAL_KEY, 0);

  // update tampilan
  document.getElementById("balance").textContent = bal.toLocaleString("id-ID");

  // kasih feedback biar terasa nyata sampe sini refresh
  alert("Saldo berhasil diperbarui!");
});


/*tombol on/of*/
const btn = document.getElementById("toggleThemeBtn");
  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    btn.textContent = document.body.classList.contains("dark-mode")
      ? "☀️ Light Mode"
      : "🌙 Dark Mode";
  });

document.addEventListener('DOMContentLoaded', () => {
const canvas = document.getElementById("carGame");
if(!canvas) {
// halaman ini tidak punya canvas -> nothing to do
return;
}
const ctx = canvas.getContext("2d");

// elemen kontrol (bisa null jika belum ada)
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const redeemBtn = document.getElementById("redeemBtn");
const scoreEl = document.getElementById("score");
const coinsEl = document.getElementById("coins");
const sheet = document.getElementById("davigoPointSheet"); // pastikan id ini sesuai HTML

// game state (dibungkus agar tidak polusi global)
const CarGame = {
car: { x: (canvas.width-40)/2, y: canvas.height-60, width: 40, height: 60, color: "#0b63d6" },
obstacles: [],
coins: [],
score: 0,
coinCount: 0,
animId: null,
obstacleTimer: null,
coinTimer: null,
obstacleInterval: 1800,
coinInterval: 3000,
gameOver: false,
holdIntervalLeft: null,
holdIntervalRight: null,

reset() {  
  this.obstacles = [];  
  this.coins = [];  
  this.score = 0;  
  this.coinCount = 0;  
  this.gameOver = false;  
  this.car.x = (canvas.width - this.car.width) / 2;  
  updateUI();  
},  

start() {  
  // jangan start kalau sudah jalan  
  if (this.animId) return;  
  this.reset();  
  // spawn timers  
  this.obstacleTimer = setInterval(() => this.spawnObstacle(), this.obstacleInterval);  
  this.coinTimer = setInterval(() => this.spawnCoin(), this.coinInterval);  
  // start loop  
  const loop = () => this.loop();  
  this.animId = requestAnimationFrame(loop);  
},  

stop() {  
  if (this.animId) cancelAnimationFrame(this.animId);  
  this.animId = null;  
  if (this.obstacleTimer){ clearInterval(this.obstacleTimer); this.obstacleTimer = null; }  
  if (this.coinTimer){ clearInterval(this.coinTimer); this.coinTimer = null; }  
},  

spawnObstacle() {  
  const w = 36 + Math.random()*24;  
  const x = Math.random() * (canvas.width - w);  
  this.obstacles.push({ x, y: -80, width: w, height: 50 + Math.random()*40, color: "#ef4444" });  
  // keep array small  
  if (this.obstacles.length > 20) this.obstacles.shift();  
},  

spawnCoin() {  
  const x = 12 + Math.random() * (canvas.width - 24);  
  this.coins.push({ x, y: -20, radius: 10, color: "#f59e0b" });  
  if (this.coins.length > 20) this.coins.shift();  
},  

moveLeft(step = 20) {  
  this.car.x = Math.max(6, this.car.x - step);  
},  

moveRight(step = 20) {  
  this.car.x = Math.min(canvas.width - this.car.width - 6, this.car.x + step);  
},  

loop() {  
  if (this.gameOver) {  
    this.stop();  
    // beri kesempatan user restart: bisa diganti sesuai UX  
    setTimeout(()=>{ alert("Game Over! Skor: " + this.score + " • Coin: " + this.coinCount); }, 50);  
    return;  
  }  

  // update  
  ctx.clearRect(0,0,canvas.width,canvas.height);  

  // draw road / background subtle  
  ctx.fillStyle = "#e6eefc";  
  ctx.fillRect(0,0,canvas.width,canvas.height);  

  // draw car  
  ctx.fillStyle = this.car.color;  
  roundRect(ctx, this.car.x, this.car.y, this.car.width, this.car.height, 6, true, false);  

  // obstacles  
  for (let i = this.obstacles.length-1; i >= 0; i--) {  
    const obs = this.obstacles[i];  
    obs.y += 3 + Math.min(4, this.score/1000); // makin cepat  
    ctx.fillStyle = obs.color;  
    roundRect(ctx, obs.x, obs.y, obs.width, obs.height, 6, true, false);  

    // collision  
    if (this.rectIntersect(this.car, obs)) {  
      this.gameOver = true;  
    }  

    if (obs.y > canvas.height + 100) this.obstacles.splice(i,1);  
  }  

  // coins  
  for (let i = this.coins.length-1; i >= 0; i--) {  
    const c = this.coins[i];  
    c.y += 2.2;  
    ctx.beginPath();  
    ctx.fillStyle = c.color;  
    ctx.arc(c.x, c.y, c.radius, 0, Math.PI*2);  
    ctx.fill();  
    ctx.closePath();  

    // collision coin pickup (simple box test)  
    if (this.circleRectIntersect(c, this.car)) {  
      this.coinCount++;  
      this.coins.splice(i,1);  
      updateUI();  
    }  
    if (c.y > canvas.height + 50) this.coins.splice(i,1);  
  }  

  // score  
  this.score++;  
  updateUI();  

  // continue  
  this.animId = requestAnimationFrame(()=>this.loop());  
},  

rectIntersect(a,b){  
  return a.x < b.x + b.width &&  
         a.x + a.width > b.x &&  
         a.y < b.y + b.height &&  
         a.y + a.height > b.y;  
},  

circleRectIntersect(circle, rect){  
  const distX = Math.abs(circle.x - rect.x - rect.width/2);  
  const distY = Math.abs(circle.y - rect.y - rect.height/2);  
  if (distX > (rect.width/2 + circle.radius)) return false;  
  if (distY > (rect.height/2 + circle.radius)) return false;  
  if (distX <= (rect.width/2)) return true;  
  if (distY <= (rect.height/2)) return true;  
  const dx = distX - rect.width/2;  
  const dy = distY - rect.height/2;  
  return (dx*dx + dy*dy <= (circle.radius * circle.radius));  
},  

redeemCoins() {  
  if (this.coinCount <= 0) { alert('Belum punya coin. Kumpulkan dulu!'); return; }  
  // jika ada storage object (dari kode utama), pakai; kalau tidak, beri info  
  if (typeof storage !== 'undefined' && typeof BAL_KEY !== 'undefined') {  
    const valuePerCoin = 100; // contoh: 1 coin = Rp100  
    const add = this.coinCount * valuePerCoin;  
    let bal = storage.get(BAL_KEY,0); bal += add; storage.set(BAL_KEY, bal);  
    document.getElementById('balance') && (document.getElementById('balance').innerText = bal.toLocaleString('id-ID'));  
    alert('Berhasil tukar ' + this.coinCount + ' coin → ' + rupiah(add) + ' ke saldo.');  
    this.coinCount = 0;  
    updateUI();  
  } else {  
    alert('Fitur tukar belum tersedia (storage tidak ditemukan).');  
  }  
}

}; // end CarGame

// helper draw rounded rect
function roundRect(ctx, x, y, w, h, r, fill, stroke){
if (typeof r === 'undefined') r = 5;
ctx.beginPath();
ctx.moveTo(x + r, y);
ctx.arcTo(x + w, y, x + w, y + h, r);
ctx.arcTo(x + w, y + h, x, y + h, r);
ctx.arcTo(x, y + h, x, y, r);
ctx.arcTo(x, y, x + w, y, r);
ctx.closePath();
if (fill){ ctx.fill(); }
if (stroke){ ctx.stroke(); }
}

function updateUI(){
if(scoreEl) scoreEl.innerText = CarGame.score;
if(coinsEl) coinsEl.innerText = CarGame.coinCount;
}

// keyboard control
document.addEventListener('keydown', (e) => {
if (e.key === 'ArrowLeft') CarGame.moveLeft();
if (e.key === 'ArrowRight') CarGame.moveRight();
// WASD support (optional)
if (e.key === 'a' || e.key === 'A') CarGame.moveLeft();
if (e.key === 'd' || e.key === 'D') CarGame.moveRight();
});

// button click (safely attach)
if (leftBtn) {
// quick click
leftBtn.addEventListener('click', ()=> CarGame.moveLeft());
// hold behaviour
leftBtn.addEventListener('pointerdown', () => {
if (CarGame.holdIntervalLeft) clearInterval(CarGame.holdIntervalLeft);
CarGame.holdIntervalLeft = setInterval(()=>CarGame.moveLeft(8), 80);
});
['pointerup','pointercancel','pointerleave','mouseout'].forEach(ev=>{
leftBtn.addEventListener(ev, ()=> { if (CarGame.holdIntervalLeft) { clearInterval(CarGame.holdIntervalLeft); CarGame.holdIntervalLeft = null; }});
});
}
if (rightBtn) {
rightBtn.addEventListener('click', ()=> CarGame.moveRight());
rightBtn.addEventListener('pointerdown', () => {
if (CarGame.holdIntervalRight) clearInterval(CarGame.holdIntervalRight);
CarGame.holdIntervalRight = setInterval(()=>CarGame.moveRight(8),80);
});
['pointerup','pointercancel','pointerleave','mouseout'].forEach(ev=>{
rightBtn.addEventListener(ev, ()=> { if (CarGame.holdIntervalRight) { clearInterval(CarGame.holdIntervalRight); CarGame.holdIntervalRight = null; }});
});
}

// redeem
if (redeemBtn) redeemBtn.addEventListener('click', ()=> CarGame.redeemCoins());

// start/stop when sheet open/close -> pakai MutationObserver sehingga tidak bergantung pada trigger
if (sheet) {
const mo = new MutationObserver((mutations)=>{
mutations.forEach(m=>{
if (m.attributeName === 'class') {
if (sheet.classList.contains('open')) {
// delay kecil agar animasi sheet selesai
setTimeout(()=> CarGame.start(), 120);
} else {
CarGame.stop();
}
}
});
});
mo.observe(sheet, { attributes: true });
} else {
// bila sheet tidak ada, start langsung (fallback)
CarGame.start();
}

// safe cleanup when page unload
window.addEventListener('beforeunload', ()=> {
CarGame.stop();
});
});

// ambil tombol lama
let tabLogout = document.getElementById("tabLogout");

// trik: clone biar semua event lama hilang
let newBtn = tabLogout.cloneNode(true);
tabLogout.parentNode.replaceChild(newBtn, tabLogout);

// ambil lagi tombol baru (ID tetap sama: tabLogout)
tabLogout = document.getElementById("tabLogout");

// ambil popup & tombol dalam popup
const popupLogout = document.getElementById("popupLogout");
const batalBtn = document.getElementById("batalBtn");
const keluarBtn = document.getElementById("keluarBtn");

// ambil semua tombol nav
const navButtons = document.querySelectorAll("nav button");

// klik profil → buka popup + kasih efek aktif
tabLogout.addEventListener("click", (e) => {
  e.preventDefault(); // cegah logout langsung
  popupLogout.classList.remove("hidden");

  // hapus aktif dari semua tombol nav
  navButtons.forEach(btn => btn.classList.remove("text-blue-600"));

  // kasih aktif ke profil
  tabLogout.classList.add("text-blue-600");
});

// klik batal → tutup popup + hapus efek aktif
batalBtn.addEventListener("click", () => {
  popupLogout.classList.add("hidden");
  tabLogout.classList.remove("text-blue-600");
});

// klik keluar → logout asli
keluarBtn.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "login.html"; // redirect ke login
});

// kalau klik tombol nav lain selain profil → popup tutup + efek aktif hilang
navButtons.forEach(btn => {
  if (btn.id !== "tabLogout") {
    btn.addEventListener("click", () => {
      popupLogout.classList.add("hidden");
      tabLogout.classList.remove("text-blue-600");
    });
  }
});


  // Data notifikasi kecil
  const notifSmallData = [
    {
      left: '📣 Beberapa orang 👉 🎁 <strong>DAVIGO Deals</strong> oleh 👩‍👩‍👦',
      right: '🔥'
    },
    {
      left: '📣 Temanmu baru saja mendapatkan <strong>Voucher Diskon</strong>!',
      right: '🎉'
    },
    {
      left: '📣 Jangan lewatkan <strong>Promo Cashback</strong> hari ini!',
      right: '💰'
    },
    {
      left: '📣 Ada <strong>Event Spesial</strong> di aplikasi DANA!',
      right: '✨'
    }
  ];

  // Data chat untuk notif card 1 dan 2
  const notifCard1Data = [
    {
      icon: 'https://placehold.co/36x36/00AEEF/FFFFFF?text=%F0%9F%91%A5',
      text: '<strong>Temanmu</strong> 👉 🎁 dari 👥',
      time: '7d'
    },
    {
      icon: 'https://placehold.co/36x36/FF4500/FFFFFF?text=%F0%9F%8E%89',
      text: '<strong>Event</strong> Spesial: Menangkan hadiah menarik!',
      time: '1h'
    },
    {
      icon: 'https://placehold.co/36x36/008000/FFFFFF?text=%F0%9F%92%B0',
      text: '<strong>Promo</strong> Cashback hingga 50%!',
      time: '30m'
    }
  ];

  const notifCard2Data = [
    {
      icon: 'https://placehold.co/36x36/0044CC/FFFFFF?text=%F0%9F%9A%9A',
      text: '<strong>DANA</strong> Bayar STNK praktis via e-Samsat di DANA',
      time: '9m'
    },
    {
      icon: 'https://placehold.co/36x36/800080/FFFFFF?text=%F0%9F%8E%81',
      text: '<strong>Voucher</strong> Diskon 20% untuk pengguna baru!',
      time: '2h'
    },
    {
      icon: 'https://placehold.co/36x36/FFA500/FFFFFF?text=%F0%9F%8E%81',
      text: '<strong>Event</strong> Terbatas: Klaim hadiahmu sekarang!',
      time: '45m'
    }
  ];

  let notifSmallIndex = 0;
  let notifCard1Index = 0;
  let notifCard2Index = 0;

  // Referensi elemen notif kecil
  const notifSmall = document.getElementById('notifSmall');
  const leftWrapper = notifSmall.querySelector('.left .notif-text-wrapper');
  const rightWrapper = notifSmall.querySelector('.right .notif-text-wrapper');

  // Referensi notif card 1
  const notifCard1 = document.getElementById('notifCard1');
  const notifCard1Icon = document.getElementById('notifCard1Icon');
  const notifCard1Text = document.getElementById('notifCard1Text');
  const notifCard1Time = document.getElementById('notifCard1Time');

  // Referensi notif card 2
  const notifCard2 = document.getElementById('notifCard2');
  const notifCard2Icon = document.getElementById('notifCard2Icon');
  const notifCard2Text = document.getElementById('notifCard2Text');
  const notifCard2Time = document.getElementById('notifCard2Time');

  // Fungsi animasi slide up keluar
  function slideUpOut(element) {
    return new Promise(resolve => {
      element.classList.add('slide-up-out');
      element.addEventListener('animationend', function handler() {
        element.removeEventListener('animationend', handler);
        element.classList.remove('slide-up-out');
        resolve();
      });
    });
  }

  // Fungsi animasi slide up masuk
  function slideUpIn(element) {
    return new Promise(resolve => {
      element.classList.add('slide-up-in');
      element.addEventListener('animationend', function handler() {
        element.removeEventListener('animationend', handler);
        element.classList.remove('slide-up-in');
        resolve();
      });
    });
  }

  // Fungsi update notif kecil
  async function updateNotifSmall() {
    notifSmallIndex = (notifSmallIndex + 1) % notifSmallData.length;

    await Promise.all([
      slideUpOut(leftWrapper),
      slideUpOut(rightWrapper)
    ]);

    leftWrapper.innerHTML = notifSmallData[notifSmallIndex].left;
    leftWrapper.setAttribute('data-text', leftWrapper.textContent);
    rightWrapper.innerHTML = notifSmallData[notifSmallIndex].right;
    rightWrapper.setAttribute('data-text', rightWrapper.textContent);

    await Promise.all([
      slideUpIn(leftWrapper),
      slideUpIn(rightWrapper)
    ]);
  }

  // Fungsi update notif card 1
  async function updateNotifCard1() {
    notifCard1Index = (notifCard1Index + 1) % notifCard1Data.length;

    await slideUpOut(notifCard1);
    notifCard1Icon.src = notifCard1Data[notifCard1Index].icon;
    notifCard1Text.innerHTML = notifCard1Data[notifCard1Index].text;
    notifCard1Time.textContent = notifCard1Data[notifCard1Index].time;
    await slideUpIn(notifCard1);
  }

  // Fungsi update notif card 2
  async function updateNotifCard2() {
    notifCard2Index = (notifCard2Index + 1) % notifCard2Data.length;

    await slideUpOut(notifCard2);
    notifCard2Icon.src = notifCard2Data[notifCard2Index].icon;
    notifCard2Text.innerHTML = notifCard2Data[notifCard2Index].text;
    notifCard2Time.textContent = notifCard2Data[notifCard2Index].time;
    await slideUpIn(notifCard2);
  }

  // Set data-text awal supaya glitch animasi jalan
  leftWrapper.setAttribute('data-text', leftWrapper.textContent);
  rightWrapper.setAttribute('data-text', rightWrapper.textContent);

  // Interval update
  setInterval(updateNotifSmall, 5000);
  setInterval(updateNotifCard1, 7000);
  setInterval(updateNotifCard2, 9000);

    /* ========= Expose for inline buttons from HTML ========= */
    window.logout = logout;
