import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Adatvedelem() {
  const { loggedIn } = useAuth()

  return (
    <>
      
      <div className="aszf-header text-center">
        <div className="container">
          <h1 className="fw-bold"><i className="fa-solid fa-lock me-2"></i>Adatvédelmi Nyilatkozat</h1>
          <p className="mb-0 opacity-75">Hatályos: 2026. január 1-től</p>
        </div>
      </div>

      
      <div className="container my-5 aszf-content" style={{ maxWidth: '860px' }}>
        <div className="alert alert-info">
          Jelen Adatvédelmi Nyilatkozat tájékoztatást nyújt arról, hogy a RaktárBérlés Kft. milyen személyes adatokat
          kezel, azokat hogyan használja fel, és milyen jogok illetik meg Önt az adatai kapcsán.
        </div>

        <h4>1. Az adatkezelő adatai</h4>
        <p>
          <strong>Cégnév:</strong> RaktárBérlés Kft.<br />
          <strong>Székhely:</strong> 9700 Szombathely, Ipari út 1.<br />
          <strong>Cégjegyzékszám:</strong> 18-09-123456<br />
          <strong>Adószám:</strong> 12345678-2-18<br />
          <strong>E-mail:</strong> adatvedelem@raktarbeles.hu<br />
          <strong>Telefonszám:</strong> +36 94 123 456
        </p>

        <h4>2. Az adatkezelés jogalapja</h4>
        <p>
          A személyes adatok kezelésének jogalapja az Európai Parlament és a Tanács (EU) 2016/679 rendelete (GDPR),
          valamint az információs önrendelkezési jogról és az információszabadságról szóló 2011. évi CXII. törvény (Info. tv.).
        </p>
        <p>Az adatkezelés jogalapjai:</p>
        <ul>
          <li><strong>Szerződés teljesítése</strong> – a bérlési szerződés megkötéséhez és teljesítéséhez szükséges adatok kezelése (GDPR 6. cikk (1) b) pont).</li>
          <li><strong>Hozzájárulás</strong> – a regisztráció során az Ügyfél kifejezetten hozzájárul adatai kezeléséhez (GDPR 6. cikk (1) a) pont).</li>
          <li><strong>Jogi kötelezettség teljesítése</strong> – jogszabály által előírt kötelezettségek (GDPR 6. cikk (1) c) pont).</li>
        </ul>

        <h4>3. A kezelt személyes adatok köre</h4>
        <p>A regisztráció és a szolgáltatás igénybevétele során az alábbi személyes adatok kerülnek rögzítésre:</p>
        <ul>
          <li>Teljes név</li>
          <li>E-mail cím</li>
          <li>Telefonszám</li>
          <li>Születési dátum</li>
          <li>Bérlési előzmények (helyszín, dátumok, tároló típusa)</li>
          <li>Bejelentkezési adatok (e-mail + titkosított jelszó)</li>
        </ul>

        <h4>4. Az adatkezelés célja</h4>
        <p>A kezelt személyes adatok kizárólag az alábbi célokra kerülnek felhasználásra:</p>
        <ul>
          <li>A felhasználói fiók létrehozása és kezelése</li>
          <li>A bérlési szerződések megkötése és nyilvántartása</li>
          <li>A nyitókód-rendszer üzemeltetése</li>
          <li>Ügyfélszolgálati feladatok ellátása</li>
          <li>Jogszabályi kötelezettségek teljesítése (számlázás, adózás)</li>
          <li>Visszaélések megelőzése és biztonsági célok</li>
        </ul>

        <h4>5. Az adatok tárolásának időtartama</h4>
        <p>
          A személyes adatokat a felhasználói fiók fennállásáig, illetve a bérlési jogviszony megszűnésétől számított
          <strong> 5 évig</strong> tároljuk, a számviteli és adójogi kötelezettségek teljesítéséhez szükséges mértékben.
          A fiók törlése esetén az adatok anonimizálásra kerülnek, kivéve, ha jogszabály hosszabb megőrzési kötelezettséget ír elő.
        </p>

        <h4>6. Adattovábbítás, adatfeldolgozók</h4>
        <p>
          A RaktárBérlés Kft. az Ügyfél személyes adatait harmadik félnek nem adja el, nem adja bérbe, és kizárólag
          az alábbiaknak továbbítja:
        </p>
        <ul>
          <li><strong>Tárhelyszolgáltató:</strong> a webalkalmazás üzemeltetéséhez szükséges mértékben</li>
          <li><strong>Könyvelő / könyvvizsgáló:</strong> jogszabályi kötelezettségek teljesítéséhez</li>
          <li><strong>Hatóságok:</strong> jogszabályi kötelezettség esetén (pl. bírósági megkeresés)</li>
        </ul>

        <h4>7. Az Ügyfél jogai</h4>
        <p>Az Ügyfelet az alábbi jogok illetik meg személyes adatai kapcsán:</p>
        <ul>
          <li><strong>Hozzáférési jog:</strong> jogosult tájékoztatást kérni a kezelt adatokról (GDPR 15. cikk).</li>
          <li><strong>Helyesbítési jog:</strong> kérheti a pontatlan adatok kijavítását (GDPR 16. cikk).</li>
          <li><strong>Törlési jog („elfeledtetéshez való jog"):</strong> kérheti adatai törlését (GDPR 17. cikk).</li>
          <li><strong>Adatkezelés korlátozásához való jog:</strong> bizonyos esetekben kérheti az adatkezelés felfüggesztését (GDPR 18. cikk).</li>
          <li><strong>Adathordozhatósághoz való jog:</strong> kérheti adatainak géppel olvasható formátumban való kiadását (GDPR 20. cikk).</li>
          <li><strong>Tiltakozási jog:</strong> tiltakozhat adatainak kezelése ellen (GDPR 21. cikk).</li>
        </ul>
        <p>
          Jogait az <strong>adatvedelem@raktarbeles.hu</strong> e-mail-címen vagy postai úton gyakorolhatja.
          A beérkező kérelmeket <strong>30 napon belül</strong> teljesítjük.
        </p>

        <h4>8. Adatbiztonsági intézkedések</h4>
        <p>
          A RaktárBérlés Kft. megfelelő technikai és szervezési intézkedésekkel gondoskodik a személyes adatok
          védelméről, különösen:
        </p>
        <ul>
          <li>HTTPS (TLS) titkosított kapcsolat alkalmazása</li>
          <li>Jelszavak titkosított (hash) tárolása</li>
          <li>Hozzáférési jogosultságok korlátozása (csak az arra jogosult munkatársak)</li>
          <li>Rendszeres biztonsági mentések</li>
        </ul>

        <h4>9. Sütik (cookie-k) alkalmazása</h4>
        <p>
          A webalkalmazás munkamenet-cookie-kat (session token) alkalmaz a bejelentkezett állapot fenntartásához.
          Ezek a cookie-k a böngésző bezárásakor vagy a kijelentkezéskor törlődnek. Harmadik féltől származó
          nyomkövető cookie-kat nem alkalmazunk.
        </p>

        <h4>10. Felügyeleti hatóság</h4>
        <p>
          Amennyiben Ön úgy ítéli meg, hogy személyes adatainak kezelése megsérti a GDPR rendelkezéseit, jogosult
          panaszt tenni a felügyeleti hatóságnál:
        </p>
        <p>
          <strong>Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)</strong><br />
          Cím: 1055 Budapest, Falk Miksa utca 9–11.<br />
          E-mail: ugyfelszolgalat@naih.hu<br />
          Weboldal: <a href="https://www.naih.hu" target="_blank" rel="noreferrer" className="text-white-50">www.naih.hu</a>
        </p>

        <h4>11. Az Adatvédelmi Nyilatkozat módosítása</h4>
        <p>
          A Szolgáltató fenntartja a jogot jelen nyilatkozat módosítására. A változásokról az Ügyfeleket e-mailben
          értesíti, <strong>legalább 15 nappal</strong> a hatálybalépés előtt.
        </p>

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

