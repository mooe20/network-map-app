import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const UNIVERSITIES = [
  // 国立大学
  '東京大学','京都大学','大阪大学','東北大学','名古屋大学','九州大学','北海道大学','東京工業大学',
  '一橋大学','神戸大学','筑波大学','広島大学','千葉大学','岡山大学','金沢大学','熊本大学',
  '新潟大学','長崎大学','鹿児島大学','岐阜大学','三重大学','滋賀大学','愛媛大学','徳島大学',
  '山形大学','群馬大学','富山大学','福井大学','山梨大学','信州大学','静岡大学','浜松医科大学',
  '横浜国立大学','埼玉大学','電気通信大学','東京農工大学','東京外国語大学','お茶の水女子大学',
  '東京学芸大学','東京海洋大学','東京医科歯科大学','東京芸術大学','旭川医科大学',
  '北海道教育大学','室蘭工業大学','小樽商科大学','帯広畜産大学','北見工業大学','釧路公立大学',
  '弘前大学','岩手大学','宮城教育大学','秋田大学','福島大学','茨城大学','宇都宮大学',
  '高崎経済大学','千葉大学','お茶の水女子大学','電気通信大学','東京農工大学','横浜国立大学',
  '長岡技術科学大学','上越教育大学','富山大学','石川県立大学','福井大学','山梨大学',
  '信州大学','静岡大学','名古屋工業大学','愛知教育大学','三重大学','滋賀医科大学',
  '京都教育大学','京都工芸繊維大学','大阪教育大学','兵庫教育大学','奈良教育大学',
  '奈良女子大学','和歌山大学','鳥取大学','島根大学','岡山大学','広島大学','山口大学',
  '徳島大学','鳴門教育大学','香川大学','愛媛大学','高知大学','福岡教育大学','九州工業大学',
  '佐賀大学','長崎大学','熊本大学','大分大学','宮崎大学','鹿児島大学','琉球大学',
  '政策研究大学院大学','総合研究大学院大学','北陸先端科学技術大学院大学',
  '奈良先端科学技術大学院大学','情報・システム研究機構','鹿屋体育大学',
  // 公立大学
  '首都大学東京','大阪府立大学','大阪市立大学','名古屋市立大学','横浜市立大学',
  '京都府立大学','京都府立医科大学','北九州市立大学','神戸市外国語大学','兵庫県立大学',
  '広島市立大学','埼玉県立大学','千葉県立保健医療大学','神奈川県立保健福祉大学',
  '静岡県立大学','愛知県立大学','三重県立看護大学','滋賀県立大学','奈良県立大学',
  '奈良県立医科大学','和歌山県立医科大学','鳥取県立大学','島根県立大学','岡山県立大学',
  '尾道市立大学','山口県立大学','高知工科大学','長崎県立大学','熊本県立大学',
  '大分県立看護科学大学','宮崎県立看護大学','沖縄県立芸術大学','沖縄県立看護大学',
  '公立はこだて未来大学','札幌市立大学','青森県立保健大学','岩手県立大学',
  '宮城大学','秋田県立大学','山形県立保健医療大学','福島県立医科大学',
  '茨城県立医療大学','群馬県立女子大学','群馬県立県民健康科学大学',
  '高崎経済大学','前橋工科大学','都留文科大学','長野県看護大学','長野県立大学',
  '富山県立大学','石川県立大学','石川県立看護大学','福井県立大学',
  '岐阜県立看護大学','岐阜薬科大学','静岡文化芸術大学','愛知県立芸術大学',
  '名古屋外国語大学','大阪府立大学','大阪市立大学','神戸市看護大学',
  '兵庫教育大学','関西看護医療大学','奈良学園大学','鳥取環境大学',
  '山陽小野田市立山口東京理科大学','福山市立大学','叡啓大学',
  // 早慶上理MARCH・関関同立
  '早稲田大学','慶應義塾大学','上智大学','東京理科大学',
  '明治大学','青山学院大学','立教大学','中央大学','法政大学','学習院大学',
  '同志社大学','立命館大学','関西大学','関西学院大学',
  // 日東駒専・産近甲龍
  '日本大学','東洋大学','駒澤大学','専修大学',
  '京都産業大学','近畿大学','甲南大学','龍谷大学',
  // 大東亜帝国
  '大東文化大学','東海大学','亜細亜大学','帝京大学','国士舘大学',
  // 摂神追桃
  '摂南大学','神戸学院大学','追手門学院大学','桃山学院大学',
  // 女子大
  '津田塾大学','東京女子大学','日本女子大学','聖心女子大学','共立女子大学',
  'フェリス女学院大学','昭和女子大学','大妻女子大学','武庫川女子大学',
  '神戸女学院大学','同志社女子大学','京都女子大学','甲南女子大学',
  'ノートルダム清心女子大学','安田女子大学','広島女学院大学',
  '清泉女子大学','白百合女子大学','実践女子大学','跡見学園女子大学',
  '恵泉女学園大学','川村学園女子大学','東京家政大学','十文字学園女子大学',
  '椙山女学園大学','金城学院大学','愛知淑徳大学','名古屋女子大学',
  '福岡女子大学','西南女学院大学','九州女子大学',
  // 理工系
  '芝浦工業大学','東京電機大学','工学院大学','東京都市大学','日本工業大学',
  '神奈川工科大学','湘南工科大学','関東学院大学','東京工科大学',
  '名古屋工業大学','愛知工業大学','大阪工業大学','大阪電気通信大学',
  '関西大学','福岡工業大学','九州産業大学','崇城大学',
  '室蘭工業大学','北海道科学大学','金沢工業大学','福井工業大学',
  '岡山理科大学','広島工業大学',
  // 医療・薬学系
  '順天堂大学','慈恵会医科大学','日本医科大学','昭和大学','東京医科大学',
  '東京慈恵会医科大学','東邦大学','北里大学','聖マリアンナ医科大学',
  '東海大学医学部','杏林大学','帝京大学','関西医科大学','近畿大学医学部',
  '兵庫医科大学','産業医科大学','久留米大学','福岡大学医学部',
  '東京薬科大学','明治薬科大学','日本薬科大学','星薬科大学','昭和薬科大学',
  '神戸薬科大学','大阪薬科大学','京都薬科大学','名城大学薬学部',
  // 法政経・社会系
  '獨協大学','神奈川大学','東京国際大学','文教大学','国学院大学',
  '武蔵大学','成蹊大学','成城大学','明治学院大学',
  '愛知大学','名古屋学院大学','中京大学','南山大学',
  '立命館アジア太平洋大学','国際基督教大学','国際大学',
  '西南学院大学','福岡大学','熊本学園大学','鹿児島国際大学',
  // 外国語・国際系
  '東京外国語大学','神田外語大学','東京外語専門学校','大阪外国語大学',
  '神戸市外国語大学','京都外国語大学','関西外国語大学','名古屋外国語大学',
  '広島外国語大学','福岡外語専門学校',
  // 体育・芸術系
  '日本体育大学','体育大学','順天堂大学','国士舘大学','東海大学体育学部',
  '東京芸術大学','武蔵野美術大学','多摩美術大学','女子美術大学',
  '東京造形大学','日本大学芸術学部','大阪芸術大学','京都造形芸術大学',
  '金沢美術工芸大学','愛知県立芸術大学','沖縄県立芸術大学',
  // 農・水産系
  '東京農業大学','麻布大学','日本獣医生命科学大学','酪農学園大学',
  '帯広畜産大学','岩手大学農学部','東北大学農学部','宇都宮大学農学部',
  '東京農工大学','静岡大学農学部','名古屋大学農学部','三重大学生物資源学部',
  '京都大学農学部','大阪府立大学生命環境科学域','鳥取大学農学部',
  '島根大学生物資源科学部','岡山大学農学部','愛媛大学農学部',
  '高知大学農林海洋科学部','九州大学農学部','宮崎大学農学部','鹿児島大学農水産学部',
  // 北海道地区
  '北海学園大学','東海大学札幌校','藤女子大学','北星学園大学','天使大学',
  '北翔大学','札幌大学','北海道医療大学','旭川大学','帯広大谷短期大学',
  // 東北地区
  '東北学院大学','仙台大学','東北福祉大学','宮城学院女子大学','石巻専修大学',
  '東北工業大学','東北文化学園大学','東北芸術工科大学','山形大学','秋田大学',
  '弘前大学','岩手大学','福島大学',
  // 関東地区（その他）
  '東京農業大学','東京情報大学','千葉工業大学','江戸川大学','流通経済大学',
  '城西大学','文京学院大学','杏林大学','東京医療保健大学','帝京平成大学',
  '東京富士大学','明星大学','東京工芸大学','多摩大学','創価大学',
  '国際武道大学','植草学園大学','川崎医科大学','聖路加国際大学',
  '目白大学','東洋学園大学','関東学院大学','鎌倉女子大学','相模女子大学',
  '横浜薬科大学','産業能率大学','松蔭大学','田園調布学園大学',
  '桜美林大学','帝京大学八王子','東京経済大学','玉川大学',
  '東京基督教大学','ルーテル学院大学','恵泉女学園大学',
  '国際ファッション専門職大学',
  // 中部地区（その他）
  '愛知学院大学','名古屋商科大学','名古屋学芸大学','東海学園大学',
  '大同大学','日本福祉大学','中部大学','豊橋技術科学大学',
  '静岡産業大学','浜松学院大学','常葉大学','富士大学',
  '金沢星稜大学','北陸大学','仁愛大学','福井工業大学',
  '岐阜聖徳学園大学','中京学院大学','朝日大学','岐阜協立大学',
  // 近畿地区（その他）
  '大阪経済大学','大阪経済法科大学','大阪商業大学','大阪国際大学',
  '大阪成蹊大学','四天王寺大学','大阪体育大学','阪南大学',
  '帝塚山学院大学','桃山学院教育大学','常磐会学園大学',
  '梅花女子大学','相愛大学','羽衣国際大学','大阪樟蔭女子大学',
  '大和大学','追手門学院大学','森ノ宮医療大学','大阪人間科学大学',
  '神戸情報大学院大学','神戸松蔭女子学院大学','神戸常盤大学',
  '流通科学大学','神戸国際大学','姫路独協大学','兵庫大学',
  '園田学園女子大学','神戸女子大学','聖和大学','関西国際大学',
  '奈良大学','帝塚山大学','天理大学','畿央大学','高野山大学',
  '和歌山大学','和歌山信愛大学','高野山大学',
  '京都光華女子大学','京都橘大学','京都文教大学','嵯峨美術大学',
  '成安造形大学','大谷大学','種智院大学','花園大学','平安女学院大学',
  // 中国・四国地区（その他）
  '就実大学','岡山商科大学','川崎医療福祉大学','岡山学院大学',
  '美作大学','中国学園大学','福山大学','広島経済大学','広島国際大学',
  '広島修道大学','安田女子大学','比治山大学','山口東京理科大学',
  '山口学芸大学','東亜大学','梅光学院大学','下関市立大学',
  '鳴門教育大学','徳島文理大学','四国大学','徳島科学技術高校',
  '松山大学','松山東雲女子大学','聖カタリナ大学','高知大学',
  '高知工科大学','高知県立大学',
  // 九州・沖縄地区（その他）
  '福岡大学','九州産業大学','福岡工業大学','福岡女学院大学',
  '西南学院大学','久留米大学','第一薬科大学','帝京大学福岡',
  '活水女子大学','長崎純心大学','長崎外国語大学','長崎ウエスレヤン大学',
  '佐賀大学','西九州大学','熊本学園大学','熊本保健科学大学',
  '崇城大学','九州看護福祉大学','別府大学','立命館アジア太平洋大学',
  '大分大学','日本文理大学','宮崎大学','宮崎産業経営大学',
  '南九州大学','鹿児島大学','志學館大学','第一工業大学',
  '沖縄大学','名桜大学','沖縄国際大学','沖縄キリスト教学院大学',
].filter((v, i, a) => a.indexOf(v) === i).sort();

const MAJORS = [
  // 人文・社会
  '文学','日本文学','英米文学','フランス文学','ドイツ文学','中国文学','比較文学',
  '哲学','倫理学','美学・芸術学','史学・歴史学','考古学','地理学','心理学','社会学',
  '社会福祉学','教育学','教育心理学','文化人類学','言語学','日本語日本文化',
  // 法・政治・経済
  '法学','政治学','国際関係学','国際政治学','経済学','経営学','商学','会計学',
  '財政学','金融学','マーケティング','経営情報学','国際経営学','行政学','公共政策',
  // 理工
  '数学','統計学','物理学','化学','生物学','地球科学','天文学','情報科学','情報工学',
  'コンピュータサイエンス','電気工学','電子工学','機械工学','土木工学','建築学',
  '材料工学','化学工学','応用化学','環境工学','航空宇宙工学','ロボット工学',
  'システム工学','都市工学','数理工学','情報通信工学','制御工学',
  // 農・生命
  '農学','農業経済学','農業工学','農芸化学','林学','水産学','食品科学',
  '生命科学','生物工学','バイオテクノロジー','環境科学','畜産学',
  // 医療・保健
  '医学','歯学','薬学','看護学','保健学','公衆衛生学','理学療法学','作業療法学',
  '栄養学','臨床検査学','放射線学','視能訓練学','言語聴覚学',
  // 教育・体育
  '体育学','スポーツ科学','健康科学','武道学','養護教諭',
  // 芸術・デザイン
  '美術','デザイン','グラフィックデザイン','プロダクトデザイン','建築デザイン',
  'インテリアデザイン','ファッションデザイン','映像・映画','写真','音楽','演劇',
  '工芸','アニメーション','ゲームデザイン',
  // 国際・外国語
  '国際学','国際文化学','外国語学','英語学','国際コミュニケーション','通訳・翻訳',
  '観光学','ホスピタリティ',
  // 複合・学際
  '総合政策','環境政策','メディア学','ジャーナリズム','社会情報学',
  'データサイエンス','AI・人工知能','認知科学','神経科学',
].sort();

const SNS_PLATFORMS = ['Twitter/X', 'LinkedIn', 'Instagram', 'GitHub', 'Facebook', 'Website', 'その他'];

const NODE_COLORS = [
  { hex: '#6366f1', label: 'インディゴ' },
  { hex: '#ef4444', label: 'レッド' },
  { hex: '#f97316', label: 'オレンジ' },
  { hex: '#ffd142', label: 'イエロー' },
  { hex: '#22c55e', label: 'グリーン' },
  { hex: '#0ea5e9', label: 'スカイブルー' },
  { hex: '#3b82f6', label: 'ブルー' },
  { hex: '#a855f7', label: 'パープル' },
  { hex: '#ec4899', label: 'ピンク' },
  { hex: '#fb7185', label: 'ローズ' },
  { hex: '#f8fafc', label: 'ホワイト' },
  { hex: '#0d1117', label: 'ブラック' },
];
const RELATIONSHIP_TYPES = ['家族', 'ビジネス', '地元', '大学', 'イベント(留学・趣味・活動)', 'バイト・インターン', 'SNS', 'その他', '♡'];
const RELATIONSHIP_COLORS = {
  '家族': '#f472b6',
  'ビジネス': '#34d399',
  '地元': '#fbbf24',
  '大学': '#60a5fa',
  'イベント(留学・趣味・活動)': '#a78bfa',
  'バイト・インターン': '#6ee7b7',
  'SNS': '#94a3b8',
  'その他': '#d1d5db',
  '♡': '#ef4444',
};

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const isOwn = !id || parseInt(id) === currentUser?.id;
  const userId = isOwn ? currentUser?.id : id;

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedType, setSelectedType] = useState('ビジネス');
  const [heartTaken, setHeartTaken] = useState(false);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${userId}`);
      setProfile(res.data);
      setForm({
        name: res.data.name,
        company: res.data.company || '',
        title: res.data.title || '',
        bio: res.data.bio || '',
        school: res.data.school || '',
        major: res.data.major || '',
        hobby: res.data.hobby || '',
        node_color: res.data.node_color || '#6366f1',
        avatar_url: res.data.avatar_url || '',
        sns_links: res.data.sns_links || [],
      });
      // 繋がりリストを取得（自分も他人も）
      const netRes = await api.get(`/connections/network/${userId}`);
      // 相手のユーザー情報を整形
      const connList = netRes.data.map(c => {
        const isRequester = String(c.requester_id) === String(userId);
        return {
          id: isRequester ? c.receiver_id : c.requester_id,
          name: isRequester ? c.receiver_name : c.requester_name,
          company: isRequester ? c.receiver_company : c.requester_company,
          relationship_type: c.relationship_type,
        };
      });
      setConnections(connList);

      if (!isOwn) {
        const connRes = await api.get(`/connections/status/${userId}`);
        setConnectionStatus(connRes.data.status);
        const heartRes = await api.get('/connections/heart-taken');
        setHeartTaken(heartRes.data.taken);
      }
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/users/me', form);
      setProfile(res.data);
      updateUser({ ...currentUser, name: res.data.name });
      setEditing(false);
    } catch {
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async () => {
    try {
      await api.post('/connections', { receiver_id: parseInt(userId), relationship_type: selectedType });
      setConnectionStatus('pending');
      setShowConnectModal(false);
      if (selectedType === '♡') setHeartTaken(true);
    } catch (err) {
      alert(err.response?.data?.error || '申請に失敗しました');
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-gray-400">読み込み中...</div>
  );
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}>
        <Link to="/" className="flex items-center gap-1.5 text-indigo-600 font-medium text-sm hover:text-indigo-800">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          人脈マップ
        </Link>
        {isOwn && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            編集
          </button>
        )}
      </nav>

      <div className="max-w-lg mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {editing ? (
            <EditForm
              form={form}
              setForm={setForm}
              onSave={handleSave}
              onCancel={() => setEditing(false)}
              saving={saving}
            />
          ) : (
            <ViewProfile
              profile={profile}
              isOwn={isOwn}
              connectionStatus={connectionStatus}
              onConnectClick={() => setShowConnectModal(true)}
              connections={connections}
            />
          )}
        </div>
      </div>

      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-1">{profile.name}さんと繋がる</h3>
            <p className="text-sm text-gray-500 mb-4">関係タイプを選択してください</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {RELATIONSHIP_TYPES.map(type => {
                const isHeart = type === '♡';
                const disabled = isHeart && heartTaken;
                return (
                  <button
                    key={type}
                    onClick={() => !disabled && setSelectedType(type)}
                    disabled={disabled}
                    className={`py-2 px-3 rounded-xl text-sm border-2 transition-colors font-medium relative ${
                      disabled
                        ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed'
                        : selectedType === type
                          ? 'text-white border-transparent'
                          : 'border-gray-200 text-gray-700 hover:border-indigo-300'
                    }`}
                    style={selectedType === type && !disabled ? { backgroundColor: RELATIONSHIP_COLORS[type], borderColor: RELATIONSHIP_COLORS[type] } : {}}
                  >
                    {type}
                    {disabled && <span className="block text-xs text-gray-300 font-normal">使用中</span>}
                  </button>
                );
              })}
            </div>
            {selectedType === '♡' && (
              <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-3">❤️ ♡ は1人にしか送れません</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setShowConnectModal(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleConnect}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                申請する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SchoolInput({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = value
    ? UNIVERSITIES.filter(u => u.includes(value))
    : UNIVERSITIES;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">出身校</label>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="大学名を入力または選択..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(u => (
            <li
              key={u}
              onMouseDown={() => { onChange(u); setOpen(false); }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50 ${value === u ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'}`}
            >
              {u}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MajorInput({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = value
    ? MAJORS.filter(m => m.includes(value))
    : MAJORS;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">専攻・学部</label>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="専攻や学部を入力または選択..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(m => (
            <li
              key={m}
              onMouseDown={() => { onChange(m); setOpen(false); }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50 ${value === m ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'}`}
            >
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ViewProfile({ profile, isOwn, connectionStatus, onConnectClick, connections }) {
  return (
    <div>
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold overflow-hidden flex-shrink-0">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
            : profile.name[0]
          }
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
          {profile.title && <p className="text-gray-600 text-sm">{profile.title}</p>}
          {profile.company && (
            <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {profile.company}
            </p>
          )}
          {profile.school && (
            <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              {profile.school}
              {profile.major && <span className="text-gray-400">・{profile.major}</span>}
            </p>
          )}
          {!profile.school && profile.major && (
            <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              {profile.major}
            </p>
          )}
          {profile.hobby && (
            <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {profile.hobby}
            </p>
          )}
          {/* 繋がり数バッジ */}
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 font-semibold px-2.5 py-1 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              繋がり {connections.length}人
            </span>
          </div>
        </div>
      </div>

      {profile.bio && (
        <div className="mb-5 p-3 bg-gray-50 rounded-xl">
          <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {profile.sns_links?.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">SNS・リンク</h3>
          <div className="space-y-2">
            {profile.sns_links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                <span className="text-gray-400 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{link.platform}</span>
                <span className="truncate">{link.url}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 繋がりリスト */}
      {connections.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">繋がり</h3>
          <div className="space-y-2">
            {connections.map(conn => (
              <Link
                key={conn.id}
                to={`/profile/${conn.id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                  {conn.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{conn.name}</p>
                  {conn.company && <p className="text-xs text-gray-400 truncate">{conn.company}</p>}
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                  style={{
                    backgroundColor: (RELATIONSHIP_COLORS[conn.relationship_type] || '#94a3b8') + '22',
                    color: RELATIONSHIP_COLORS[conn.relationship_type] || '#94a3b8',
                  }}
                >
                  {conn.relationship_type}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!isOwn && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {connectionStatus === null && (
            <button
              onClick={onConnectClick}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm"
            >
              繋がりを申請する
            </button>
          )}
          {connectionStatus === 'pending' && (
            <p className="text-center text-sm text-amber-600 bg-amber-50 py-2.5 rounded-xl">申請中...</p>
          )}
          {connectionStatus === 'accepted' && (
            <p className="text-center text-sm text-green-600 bg-green-50 py-2.5 rounded-xl font-medium">繋がっています</p>
          )}
          {connectionStatus === 'rejected' && (
            <p className="text-center text-sm text-gray-400 bg-gray-50 py-2.5 rounded-xl">申請が拒否されました</p>
          )}
        </div>
      )}
    </div>
  );
}

function EditForm({ form, setForm, onSave, onCancel, saving }) {
  const addSnsLink = () => setForm({ ...form, sns_links: [...form.sns_links, { platform: 'Twitter/X', url: '' }] });
  const removeSnsLink = (i) => setForm({ ...form, sns_links: form.sns_links.filter((_, idx) => idx !== i) });
  const updateSnsLink = (i, field, value) => {
    const links = [...form.sns_links];
    links[i] = { ...links[i], [field]: value };
    setForm({ ...form, sns_links: links });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        // 正方形にクロップしてリサイズ
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setForm(f => ({ ...f, avatar_url: dataUrl }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">プロフィール編集</h2>

      {/* アバター画像アップロード */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">プロフィール画像</label>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold overflow-hidden flex-shrink-0">
            {form.avatar_url
              ? <img src={form.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              : <span>{form.name?.[0] || '?'}</span>
            }
          </div>
          <label className="cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors border border-indigo-200">
            画像を選択
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
          {form.avatar_url && (
            <button
              onClick={() => setForm(f => ({ ...f, avatar_url: '' }))}
              className="text-xs text-red-400 hover:text-red-600"
            >
              削除
            </button>
          )}
        </div>
      </div>

      {[
        { label: '名前', key: 'name', type: 'text', required: true },
        { label: '会社・組織', key: 'company', type: 'text' },
        { label: '役職', key: 'title', type: 'text' },
      ].map(({ label, key, type, required }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input
            type={type}
            value={form[key]}
            onChange={e => setForm({ ...form, [key]: e.target.value })}
            required={required}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      ))}

      <SchoolInput value={form.school} onChange={v => setForm({ ...form, school: v })} />
      <MajorInput value={form.major} onChange={v => setForm({ ...form, major: v })} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">趣味・興味</label>
        <input
          type="text"
          value={form.hobby}
          onChange={e => setForm({ ...form, hobby: e.target.value })}
          placeholder="例：旅行、カフェ巡り、映画鑑賞..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* ノードカラー選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">マップ上のアイコン色</label>
        <div className="flex flex-wrap gap-2">
          {NODE_COLORS.map(({ hex, label }) => {
            const selected = (form.node_color || '#6366f1') === hex;
            return (
              <button
                key={hex}
                type="button"
                title={label}
                onClick={() => setForm(f => ({ ...f, node_color: hex }))}
                className="w-9 h-9 rounded-full border-4 transition-all hover:scale-110 flex items-center justify-center"
                style={{
                  backgroundColor: hex,
                  borderColor: selected ? '#6366f1' : hex === '#f8fafc' ? '#d1d5db' : hex,
                  boxShadow: selected ? '0 0 0 2px white, 0 0 0 4px #6366f1' : 'none',
                  outline: selected ? 'none' : 'none',
                }}
              >
                {selected && (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill={hex === '#f8fafc' || hex === '#ffd142' ? '#374151' : 'white'}>
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          {NODE_COLORS.find(c => c.hex === (form.node_color || '#6366f1'))?.label || 'インディゴ'} を選択中
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">自己紹介</label>
        <textarea
          value={form.bio}
          onChange={e => setForm({ ...form, bio: e.target.value })}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">SNS・リンク</label>
          <button onClick={addSnsLink} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">+ 追加</button>
        </div>
        {form.sns_links.map((link, i) => (
          <div key={i} className="flex gap-2 mb-2 items-center">
            <select
              value={link.platform}
              onChange={e => updateSnsLink(i, 'platform', e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              {SNS_PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
            <input
              type="url"
              value={link.url}
              onChange={e => updateSnsLink(i, 'url', e.target.value)}
              placeholder="https://..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button onClick={() => removeSnsLink(i)} className="text-red-400 hover:text-red-600 text-xl w-6 text-center">×</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
        >
          {saving ? '保存中...' : '保存する'}
        </button>
      </div>
    </div>
  );
}
