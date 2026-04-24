import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Aszf() {
  const { loggedIn } = useAuth()

  return (
    <>
      
      <div className="aszf-header text-center">
        <div className="container">
          <h1 className="fw-bold"><i className="fa-solid fa-file-lines me-2"></i>Általános Szerződési Feltételek</h1>
          <p className="mb-0 opacity-75">Hatályos: 2026. január 1-től</p>
        </div>
      </div>

      
      <div className="container my-5 aszf-content" style={{ maxWidth: '860px' }}>
        <div className="alert alert-info">
          Kérjük, a regisztráció előtt figyelmesen olvassa el az alábbi Általános Szerződési Feltételeket.
          A regisztrációval Ön elfogadja az itt leírtakat.
        </div>

        <h4>1. A Szolgáltató adatai</h4>
        <p>
          <strong>Cégnév:</strong> RaktárBérlés Kft.<br />
          <strong>Székhely:</strong> 9700 Szombathely, Ipari út 1.<br />
          <strong>Cégjegyzékszám:</strong> 18-09-123456<br />
          <strong>Adószám:</strong> 12345678-2-18<br />
          <strong>E-mail:</strong> info@raktarbeles.hu<br />
          <strong>Telefonszám:</strong> +36 94 123 456
        </p>

        <h4>2. Az ÁSZF hatálya és elfogadása</h4>
        <p>Jelen Általános Szerződési Feltételek (a továbbiakban: ÁSZF) a RaktárBérlés Kft. (a továbbiakban: Szolgáltató)
          és a weboldal regisztrált felhasználói (a továbbiakban: Ügyfél) között létrejövő szerződéses jogviszonyra vonatkoznak.</p>
        <p>A regisztrációval az Ügyfél elfogadja jelen ÁSZF rendelkezéseit. Az ÁSZF elfogadása a regisztrációs folyamat
          kötelező eleme; annak el nem fogadása esetén a regisztráció nem hajtható végre.</p>

        <h4>3. A szolgáltatás leírása</h4>
        <p>A Szolgáltató raktárhelyiségek (tárolók) online alapú bérbeadásával foglalkozik. A felhasználók a weboldalon
          keresztül böngészhetik az elérhető tároló egységeket, megadhatják a bérlési időszakot, és elektronikus úton
          foglalást végezhetnek.</p>
        <p>A tároló egységek két kategóriában érhetők el:</p>
        <ul>
          <li><strong>Basic tároló:</strong> 6 m² alapterületű, száraz, zárt helyiség egyéni lakat lehetőséggel, megfelelő megvilágítással. Napi bérleti díj: 500 Ft.</li>
          <li><strong>Prémium tároló:</strong> 6 m² alapterületű, klímatizált, polcos felszereltségű helyiség, fokozott biztonsággal. Napi bérleti díj: 600 Ft.</li>
        </ul>

        <h4>4. Regisztráció és fiókkezelés</h4>
        <p>A szolgáltatás igénybevételéhez regisztráció szükséges. A regisztrációhoz az Ügyfélnek valós adatokat kell
          megadnia (teljes név, e-mail cím, telefonszám, születési dátum). A regisztrációhoz az Ügyfélnek legalább
          <strong> 18 évesnek</strong> kell lennie.</p>
        <p>Az Ügyfél felelős a fiókjához tartozó jelszó titkosságáért. A fiók illetéktelen használatából eredő
          károkért a Szolgáltató nem vállal felelősséget.</p>

        <h4>5. Bérlési feltételek</h4>
        <p>A bérlés az Ügyfél által megadott kezdő- és végdátum közötti időszakra szól. A bérleti díj a napok száma
          alapján kerül kiszámításra (kezdő nap + közbülső napok + végső nap × napi egységár).</p>
        <p>A bérlés lemondása az Ügyfél saját fiókjában lehetséges, a "Bérléseim" oldalon keresztül.</p>

        <h4>6. Nyitókód rendszer</h4>
        <p>A bérelt tároló egység megnyitásához a weboldalon keresztül <strong>6 jegyű nyitókód</strong> igényelhető,
          amely <strong>10 percig érvényes</strong>. A kód lejárta után új kód igénylése szükséges.</p>

        <h4>7. Díjak és fizetés</h4>
        <p>Az aktuálisan érvényes bérleti díjak a weboldalon megjelenített árlistán tekinthetők meg. A Szolgáltató
          fenntartja az árváltoztatás jogát, amely azonban a már megkötött, aktív bérlési szerződéseket nem érinti.</p>

        <h4>8. Felelősség korlátozása</h4>
        <p>A Szolgáltató nem vállal felelősséget a tárolt tárgyakban keletkező, előre nem látható eseményekből
          eredő károkért. Az Ügyfél saját biztosítás megkötéséről maga gondoskodik.</p>

        <h4>9. Adatvédelem</h4>
        <p>A Szolgáltató az Ügyfél személyes adatait kizárólag a szolgáltatás nyújtása céljából kezeli, harmadik
          félnek nem adja át, és az adatvédelemre vonatkozó hatályos jogszabályok (GDPR, Info. tv.) szerint jár el.</p>

        <h4>10. Panaszkezelés</h4>
        <p>Az Ügyfél panaszát az <strong>info@raktarbeles.hu</strong> e-mailen vagy telefonon
          (<strong>+36 94 123 456</strong>) terjesztheti elő. A Szolgáltató a beérkezett panaszokat
          <strong> 5 munkanapon belül</strong> kivizsgálja és megválaszolja.</p>

        <h4>11. Irányadó jog és jogviták</h4>
        <p>Jelen ÁSZF-re a <strong>magyar jog</strong> az irányadó. A felek közötti esetleges jogvitákra a magyar
          bíróságok rendelkeznek hatáskörrel.</p>

        <h4>12. Az ÁSZF módosítása</h4>
        <p>A Szolgáltató jogosult az ÁSZF-et egyoldalúan módosítani. A módosításokról az Ügyfeleket e-mailben
          értesíti, <strong>legalább 15 nappal</strong> a hatálybalépés előtt.</p>

        <hr className="my-4" />

        <div className="text-center">
          {loggedIn
            ? <Link to="/" className="btn btn-primary">← Vissza a főoldalra</Link>
            : <Link to="/bejelentkezes" className="btn btn-primary">← Vissza a regisztrációhoz</Link>
          }
        </div>

        <p className="text-muted text-center mt-4 small">© 2026 RaktárBérlés Kft. – Minden jog fenntartva.</p>
      </div>
    </>
  )
}

