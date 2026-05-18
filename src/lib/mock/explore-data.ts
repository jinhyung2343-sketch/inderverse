import { artworkBackendMap } from '@/lib/mock/explore-backend-map'
import type { ExploreArtwork } from '@/lib/explore'
export {
  categories,
  quickFilters,
  categoryTags,
  getEpisodeById,
} from '@/lib/explore'

function applyArtworkBackendMap(items: ExploreArtwork[]): ExploreArtwork[] {
  return items.map((artwork) => {
    const mapping = artworkBackendMap[artwork.id]

    if (!mapping) {
      return artwork
    }

    return {
      ...artwork,
      episodes: artwork.episodes.map((episode) => {
        const mappedEpisode = mapping.episodes?.[episode.id]

        return {
          ...episode,
          backendChannelId: mappedEpisode?.backendEpisodeId ? mapping.backendChannelId : episode.backendChannelId ?? mapping.backendChannelId,
          backendEpisodeId: mappedEpisode?.backendEpisodeId ?? episode.backendEpisodeId,
        }
      }),
    }
  })
}

const baseArtworks: ExploreArtwork[] = [
  {
    id: 'night-market',
    title: '월광 아래의 시장',
    authorName: '하은',
    coverImageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=900&q=80',
    status: 'publishing',
    isAdultOnly: false,
    isCommentEnabled: true,
    category: '판타지',
    filterTags: ['추천', '최신'],
    tags: ['야시장', '도시환상', '군상극'],
    blurb: '밤이 오면 다른 규칙이 열리는 시장에서, 잊힌 소원을 사고파는 사람들의 이야기.',
    summary: '밤이 오면 다른 규칙이 열리는 시장에서, 잊힌 소원을 사고파는 사람들의 이야기.',
    intro:
      '거대한 플랫폼의 추천 로직이 아닌, 작가가 직접 설계한 세계관의 결을 전면에 내세우는 작품이라는 가정으로 상세 페이지를 구성했습니다. 독자는 작품의 분위기, 태그, 회차 진입 전 흐름을 먼저 확인하고 자신에게 맞는 이야기인지 천천히 판단할 수 있습니다.',
    commentPreview:
      '“시장이라는 공간이 진짜 살아 있는 느낌이네요. 배경이 단순 무대가 아니라 인물처럼 움직여서 다음 화가 궁금해졌어요.”',
    episodes: [
      {
        id: 'ep-1',
        title: '1화. 불이 켜지는 골목',
        accessState: 'free',
        accessLabel: '무료',
        preview: '시장이 열리는 첫 밤, 아무도 모르게 사라진 간판의 불빛이 골목을 깨운다.',
        body: [
          '해가 완전히 저문 뒤에야 골목은 본래의 이름을 되찾았다. 낮에는 지도에도 없던 간판들이 하나둘 켜지며, 오래된 벽돌 틈에서 색이 스며나왔다.',
          '하은은 사람들 틈에 섞여 시장 안으로 걸어 들어갔다. 누군가는 잃어버린 기억을 팔고 있었고, 누군가는 아직 이루어지지 않은 소원을 유리병에 담아 진열하고 있었다.',
          '그날 밤 가장 늦게 불이 켜진 가게 앞에서, 하은은 자신이 분명 버렸다고 생각했던 이름 하나를 다시 마주했다.',
        ],
      },
      { id: 'ep-2', title: '2화. 잊힌 소원의 값', accessState: 'locked', accessLabel: '잠금', preview: '소원에도 가격이 있다는 사실을 알게 된 순간, 시장의 규칙은 더 이상 낭만으로 남지 않는다.', body: ['잠금 회차입니다.'] },
      { id: 'ep-3', title: '3화. 새벽의 거래자', accessState: 'locked', accessLabel: '구독 공개', preview: '거래가 끝나는 시각, 가장 늦게 남은 사람만이 들을 수 있는 목소리가 있다.', body: ['맛보기 공개 회차입니다.'] },
      { id: 'ep-4', title: '4화. 닫히지 않는 문', accessState: 'coming_soon', accessLabel: '준비중', preview: '시장이 닫혀야 할 시간인데도, 한 가게의 문만은 끝내 닫히지 않는다.', body: ['준비 중입니다.'] },
    ],
  },
  {
    id: 'city-rain',
    title: '도시 끝에 내리는 비',
    authorName: '라진',
    coverImageUrl: 'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?auto=format&fit=crop&w=900&q=80',
    status: 'publishing',
    isAdultOnly: false,
    isCommentEnabled: true,
    category: '드라마',
    filterTags: ['최신', '맛보기 공개'],
    tags: ['청춘', '재기', '도시생활'],
    blurb: '각자의 실패를 안고 살아가는 사람들이 작은 작업실에서 다시 삶의 리듬을 찾기 시작한다.',
    summary: '각자의 실패를 안고 살아가는 사람들이 작은 작업실에서 다시 삶의 리듬을 찾기 시작한다.',
    intro:
      '감정의 폭발보다 잔향을 오래 남기는 드라마 톤을 상정한 작품입니다. 큰 사건보다는 인물 사이의 미세한 변화와 일상의 균열이 중심이 되며, 차분한 독서 흐름에 어울리도록 정보 배치를 정리했습니다.',
    commentPreview:
      '“과한 장면 없이도 사람 사이의 거리감이 느껴져서 좋았어요. 작업실 공간이 주는 정서가 특히 좋습니다.”',
    episodes: [
      {
        id: 'ep-1',
        title: '1화. 남겨진 의자',
        accessState: 'free',
        accessLabel: '무료',
        preview: '비가 오던 저녁, 아무도 앉지 않던 의자 하나가 다시 자리를 찾는다.',
        body: [
          '작업실 구석의 접이식 의자는 오래 비어 있었다. 누군가 돌아오기를 기다리는 것처럼, 먼지조차 그 자리에 얌전히 내려앉아 있었다.',
          '라진은 젖은 우산을 문 앞에 세워두고 천천히 불을 켰다. 작은 형광등 아래에서 공간은 생각보다 더 오래 버텨온 표정을 하고 있었다.',
          '문이 다시 열리고, 한때 이곳을 가장 먼저 떠났던 사람이 말없이 들어왔다.',
        ],
      },
      { id: 'ep-2', title: '2화. 저녁 버스 정류장', accessState: 'locked', accessLabel: '구독 공개', preview: '돌아갈 곳을 정하지 못한 사람들은 늘 버스 정류장에서 조금 더 오래 머문다.', body: ['맛보기 공개 회차입니다.'] },
      { id: 'ep-3', title: '3화. 작은 작업실의 불빛', accessState: 'coming_soon', accessLabel: '준비중', preview: '꺼질 듯 이어지던 불빛 하나가 다시 공간 전체를 밝히기 시작한다.', body: ['준비 중입니다.'] },
    ],
  },
  {
    id: 'cold-signal',
    title: '콜드 시그널',
    authorName: '정후',
    coverImageUrl: 'https://images.unsplash.com/photo-1520034475321-cbe63696469a?auto=format&fit=crop&w=900&q=80',
    status: 'completed',
    isAdultOnly: false,
    isCommentEnabled: true,
    category: '스릴러',
    filterTags: ['인기', '완결'],
    tags: ['연쇄실종', '프로파일링', '반전'],
    blurb: '도시 곳곳에 남겨진 차가운 신호를 쫓으며, 실종 사건의 패턴을 읽어내는 추적 스릴러.',
    summary: '도시 곳곳에 남겨진 차가운 신호를 쫓으며, 실종 사건의 패턴을 읽어내는 추적 스릴러.',
    intro:
      '완결 작품이므로 정주행 동선이 잘 보이도록 설계하는 편이 자연스럽습니다. 긴장감과 몰입도를 해치지 않으면서도, 독자가 한 번에 얼마나 깊게 들어갈 수 있을지 가늠할 수 있는 정보 구성이 핵심입니다.',
    commentPreview:
      '“중반까지 쌓아둔 떡밥을 마지막에 정리하는 방식이 아주 시원했어요. 다시 읽으니 초반 장면이 다르게 보입니다.”',
    episodes: [
      {
        id: 'ep-1',
        title: '1화. 첫 번째 신호',
        accessState: 'free',
        accessLabel: '무료',
        preview: '모든 실종 사건의 시작점에는 들리지 않는 호출 하나가 남아 있었다.',
        body: [
          '정후는 새벽 두 시의 통화 기록을 다시 확인했다. 분명 연결된 시간은 있었지만, 상대의 목소리는 어느 기록에도 남아 있지 않았다.',
          '사라진 사람들의 마지막 위치를 겹쳐보자, 지도 위에는 너무 정교한 원이 그려졌다. 누군가는 이 움직임을 오래전부터 설계해두고 있었다.',
          '그가 이어폰을 귀에 꽂자, 정적 사이로 아주 미세한 전자음이 다시 들려왔다.',
        ],
      },
      { id: 'ep-2', title: '2화. 얼어붙은 메시지', accessState: 'locked', accessLabel: '구독 공개', preview: '읽힌 적 없는 메시지는 시간이 흐를수록 더 차가워진다.', body: ['구독자 공개 회차입니다.'] },
      { id: 'ep-3', title: '3화. 패턴의 시작', accessState: 'free', accessLabel: '무료', preview: '우연처럼 보이던 점들은 처음부터 하나의 규칙을 따르고 있었다.', body: ['완결작 프로모션으로 무료 공개된 회차입니다.'] },
    ],
  },
  {
    id: 'void-parade',
    title: '보이드 퍼레이드',
    authorName: '윤호',
    coverImageUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=80',
    status: 'publishing',
    isAdultOnly: false,
    isCommentEnabled: true,
    category: 'SF',
    filterTags: ['추천', '인기'],
    tags: ['우주항로', 'AI', '함대'],
    blurb: '붕괴 직전의 궤도 도시를 구하기 위해, 서로 다른 기억을 가진 승무원들이 항로를 되짚는다.',
    summary: '붕괴 직전의 궤도 도시를 구하기 위해, 서로 다른 기억을 가진 승무원들이 항로를 되짚는다.',
    intro:
      'SF 작품은 세계관과 규칙을 어느 정도 미리 보여줘야 진입 장벽이 낮아집니다. 그래서 소개 구역에서도 장르 감도와 태그를 충분히 보이게 하고, 회차에서 서서히 설정을 밝혀가는 구조를 상상했습니다.',
    commentPreview:
      '“설정 설명이 길지 않은데도 우주 도시의 압박감이 느껴져요. AI와 승무원 관계가 기대됩니다.”',
    episodes: [
      {
        id: 'ep-1',
        title: '1화. 사라진 궤도',
        accessState: 'free',
        accessLabel: '무료',
        preview: '도시를 지탱하던 주 궤도가 어긋난 날, 오래 잠들어 있던 승무원 기록이 열린다.',
        body: [
          '관제창 바깥으로 보이는 별빛이 평소보다 느리게 움직였다. 윤호는 그 미세한 차이만으로도 궤도가 이미 틀어졌다는 걸 알아챘다.',
          '함교 뒤편의 봉인 구역이 열리며, 오래전에 사망 처리된 승무원들의 기억 백업이 자동으로 복구되기 시작했다.',
          '누가 도시를 살릴 수 있는지 아직 아무도 몰랐지만, 적어도 누구의 기억을 다시 불러와야 하는지는 선명해졌다.',
        ],
      },
      { id: 'ep-2', title: '2화. 보이드 항로', accessState: 'locked', accessLabel: '잠금', preview: '공백 구간이라 불리던 항로 안쪽에서 오래 끊긴 신호가 돌아온다.', body: ['잠금 회차입니다.'] },
      { id: 'ep-3', title: '3화. 잔향을 남긴 AI', accessState: 'locked', accessLabel: '구독 공개', preview: '삭제된 줄 알았던 인공 지능의 잔향이 승무원들의 대화를 뒤틀기 시작한다.', body: ['맛보기 공개 회차입니다.'] },
    ],
  },
  {
    id: 'midnight-letters',
    title: '자정의 편지함',
    authorName: '서린',
    coverImageUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=80',
    status: 'publishing',
    isAdultOnly: false,
    isCommentEnabled: false,
    category: '로맨스',
    filterTags: ['추천'],
    tags: ['비밀편지', '재회', '감정선'],
    blurb: '매일 자정이면 도착하는 이름 없는 편지 한 통이 오래된 관계를 다시 흔들어 놓는다.',
    summary: '매일 자정이면 도착하는 이름 없는 편지 한 통이 오래된 관계를 다시 흔들어 놓는다.',
    intro:
      '관계와 감정선이 중심인 작품은 댓글 분위기와 진입 전 기대감이 중요합니다. 지금은 댓글이 닫혀 있다는 설정으로, 작가가 작품별 커뮤니티 온도를 스스로 조절할 수 있다는 방향도 함께 보여주고 있습니다.',
    commentPreview:
      '댓글이 닫혀 있는 작품입니다. 작가의 의도에 따라 일정 시점 이후 열리거나, 감상 게시판으로 분리될 수 있습니다.',
    episodes: [
      {
        id: 'ep-1',
        title: '1화. 첫 번째 편지',
        accessState: 'free',
        accessLabel: '무료',
        preview: '자정이 되자 우편함 속에 없던 편지 한 통이 조용히 모습을 드러냈다.',
        body: [
          '서린은 매일 같은 시간, 같은 우편함을 확인했다. 오늘도 비어 있을 거라 생각했지만 손끝에 닿은 종이의 감촉은 너무 분명했다.',
          '봉투 앞면에는 자신의 이름만 적혀 있었고, 발신인은 끝내 비워져 있었다. 종이를 펼치는 순간 오래전 멈췄던 대화가 다시 시작됐다.',
          '편지는 한 줄로 끝났다. “이번에는 네가 먼저 돌아봐 줘.”',
        ],
      },
      { id: 'ep-2', title: '2화. 수신인 없음', accessState: 'locked', accessLabel: '잠금', preview: '보낸 사람 없는 편지가 계속 도착한다면, 남는 건 기다림뿐일까.', body: ['잠금 회차입니다.'] },
      { id: 'ep-3', title: '3화. 남겨진 서랍', accessState: 'coming_soon', accessLabel: '준비중', preview: '한 번도 열리지 않았던 서랍 안에서 오래된 감정이 모습을 드러낸다.', body: ['준비 중입니다.'] },
    ],
  },
  {
    id: 'red-harbor',
    title: '붉은 항로',
    authorName: '태오',
    coverImageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    status: 'publishing',
    isAdultOnly: false,
    isCommentEnabled: true,
    category: '액션',
    filterTags: ['인기', '최신'],
    tags: ['잠입', '도시전', '추격'],
    blurb: '밀항 루트를 장악한 거대 조직 사이에서, 잃어버린 이름을 되찾기 위한 추격전이 시작된다.',
    summary: '밀항 루트를 장악한 거대 조직 사이에서, 잃어버린 이름을 되찾기 위한 추격전이 시작된다.',
    intro:
      '액션 장르는 첫인상에서 속도감이 중요합니다. 작품 소개는 짧고 강하게, 회차 목록은 빠른 진입이 가능하도록 정리하는 것이 자연스럽다고 보고 구성했습니다.',
    commentPreview:
      '“1화부터 속도가 좋네요. 배경 설명보다 바로 액션으로 밀어붙이는 느낌이 작품 톤과 잘 맞습니다.”',
    episodes: [
      {
        id: 'ep-1',
        title: '1화. 봉인된 항로',
        accessState: 'free',
        accessLabel: '무료',
        preview: '항만의 모든 불빛이 꺼진 밤, 가장 먼저 움직인 건 사람보다 그림자였다.',
        body: [
          '태오는 녹슨 컨테이너 사이를 미끄러지듯 지나갔다. 해무는 낮게 깔려 있었고, 총구보다 먼저 사람의 숨이 흔들렸다.',
          '봉인된 항로라 불리던 길이 다시 열리기 시작하자, 오래 숨겨둔 이름들이 무전기 안에서 하나씩 불렸다.',
          '그는 마지막으로 남은 표식을 벽에서 떼어내며 자신이 정말 쫓고 있는 것이 사람인지 과거인지 묻기 시작했다.',
        ],
      },
      { id: 'ep-2', title: '2화. 붉은 조명 아래', accessState: 'locked', accessLabel: '구독 공개', preview: '붉은 경고등이 켜진 뒤에는 누구도 안전지대라고 부를 수 없다.', body: ['구독자 공개 회차입니다.'] },
      { id: 'ep-3', title: '3화. 추격의 시작', accessState: 'locked', accessLabel: '구독 공개', preview: '멈추지 않기 위해서는 먼저 버려야 할 이름이 있다.', body: ['맛보기 공개 회차입니다.'] },
    ],
  },
  {
    id: 'blade-of-mist',
    title: '운무검록',
    authorName: '무진',
    coverImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
    status: 'publishing',
    isAdultOnly: false,
    isCommentEnabled: true,
    category: '무협',
    filterTags: ['추천', '최신'],
    tags: ['강호', '문파', '검술'],
    blurb: '사라진 비급의 흔적을 따라 강호를 떠도는 검객이 자신의 사문과 다시 마주한다.',
    summary: '사라진 비급의 흔적을 따라 강호를 떠도는 검객이 자신의 사문과 다시 마주한다.',
    intro:
      '무협은 문파, 강호, 수련 단계 같은 익숙한 문법을 어떻게 새롭게 보이느냐가 중요합니다. 그래서 태그와 소개 문단에서 정통성을 보여주되, 회차 제목에서는 이야기의 추진력을 함께 살렸습니다.',
    commentPreview:
      '“검술 묘사가 묵직해서 좋았습니다. 세계관 설명이 과하지 않고 강호 분위기가 자연스럽게 들어오네요.”',
    episodes: [
      {
        id: 'ep-1',
        title: '1화. 운무 속의 검',
        accessState: 'free',
        accessLabel: '무료',
        preview: '안개가 짙게 깔린 새벽, 검 한 자루가 먼저 길의 주인을 알아본다.',
        body: [
          '무진은 산마루 아래로 내려오기 전 세 번 숨을 고른다. 검을 뽑는 순간, 안개는 베이는 것이 아니라 밀려난다는 걸 그는 오래전에 배웠다.',
          '강호의 이름난 문파들은 이미 오래전에 그를 잊었다고 생각했지만, 산 아래 객점 벽에는 아직도 사문의 표식이 희미하게 남아 있었다.',
          '사라진 비급의 첫 흔적은 뜻밖에도 그 표식 아래 접힌 종이 한 장으로 시작됐다.',
        ],
      },
      { id: 'ep-2', title: '2화. 사라진 비급', accessState: 'locked', accessLabel: '구독 공개', preview: '누군가는 비급을 훔쳤고, 누군가는 그 사실을 오래전부터 알고 있었다.', body: ['맛보기 공개 회차입니다.'] },
      { id: 'ep-3', title: '3화. 사문의 그림자', accessState: 'locked', accessLabel: '잠금', preview: '돌아가고 싶지 않았던 과거가 가장 먼저 칼끝을 향해 다가온다.', body: ['잠금 회차입니다.'] },
    ],
  },
  {
    id: 'laugh-track',
    title: '웃음 스위치',
    authorName: '도하',
    coverImageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
    status: 'publishing',
    isAdultOnly: false,
    isCommentEnabled: true,
    category: '코믹',
    filterTags: ['인기', '맛보기 공개'],
    tags: ['오피스개그', '텐션', '캐릭터극'],
    blurb: '평범한 사무실인 줄 알았는데, 출근 버튼 하나로 세계가 매일 다른 장르로 바뀐다.',
    summary: '평범한 사무실인 줄 알았는데, 출근 버튼 하나로 세계가 매일 다른 장르로 바뀐다.',
    intro:
      '코믹 장르는 작품 소개보다 톤이 더 빨리 전달돼야 합니다. 그래서 간결한 정보, 밝은 태그, 바로 볼 수 있는 회차 구조가 잘 어울리며 댓글 흐름도 활발하게 붙는 방향을 상정했습니다.',
    commentPreview:
      '“장르가 매일 바뀐다는 설정 덕분에 매 화 기대 포인트가 분명해요. 댓글 반응 보면서 읽기 좋은 타입.”',
    episodes: [
      {
        id: 'ep-1',
        title: '1화. 월요일 버튼',
        accessState: 'free',
        accessLabel: '무료',
        preview: '월요일 아침 출근 버튼을 누른 순간, 회사 전체가 뮤지컬 세트장으로 변한다.',
        body: [
          '도하는 평소처럼 카드키를 찍었을 뿐이었다. 그런데 엘리베이터 문이 열리자마자 사무실 천장에서 스포트라이트가 떨어졌다.',
          '대리님은 결재 서류를 들고 탭댄스를 시작했고, 팀장은 오늘의 매출 목표를 후렴구로 부르고 있었다.',
          '도하가 유일하게 확신한 사실은 하나였다. 이 회사는 평범하지 않고, 오늘은 분명 월요일보다 더 길어질 거라는 것.',
        ],
      },
      { id: 'ep-2', title: '2화. 오늘의 장르', accessState: 'free', accessLabel: '무료', preview: '출근 버튼이 매일 다른 장르를 고른다면, 화요일은 누가 책임져야 할까.', body: ['프로모션으로 공개된 무료 회차입니다.'] },
      { id: 'ep-3', title: '3화. 퇴근이 안 된다', accessState: 'coming_soon', accessLabel: '준비중', preview: '장르가 끝나지 않으면 퇴근도 끝나지 않는다.', body: ['준비 중입니다.'] },
    ],
  },
  {
    id: 'house-of-static',
    title: '화이트 노이즈 하우스',
    authorName: '가연',
    coverImageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80',
    status: 'publishing',
    isAdultOnly: false,
    isCommentEnabled: true,
    category: '공포',
    filterTags: ['추천', '최신'],
    tags: ['심령주택', '괴담', '오컬트'],
    blurb: '비가 오는 밤마다 빈 집 안에서 들려오는 잡음은, 사라진 가족의 마지막 기록을 재생하기 시작한다.',
    summary: '비가 오는 밤마다 빈 집 안에서 들려오는 잡음은, 사라진 가족의 마지막 기록을 재생하기 시작한다.',
    intro:
      '공포 장르는 태그와 회차 제목만으로도 분위기가 올라오도록 설계하는 편이 효과적입니다. 썸네일에서 받은 인상을 소개 문단과 첫 회차 리스트가 계속 이어받도록 흐름을 맞춰 두었습니다.',
    commentPreview:
      '“잡음이라는 소재가 너무 좋았어요. 눈에 보이는 공포보다 들리는 공포를 밀고 가는 느낌이라 더 무섭습니다.”',
    episodes: [
      {
        id: 'ep-1',
        title: '1화. 잡음이 들리는 밤',
        accessState: 'free',
        accessLabel: '무료',
        preview: '비가 천장을 두드리기 시작하자, 텅 빈 집 안의 라디오도 혼자 깨어났다.',
        body: [
          '가연은 분명 플러그를 뽑아두고 나갔다고 생각했다. 그런데 다시 돌아온 집 안에는 희미한 백색 잡음이 벽을 타고 번지고 있었다.',
          '라디오 다이얼은 저절로 돌아가며 누군가의 끊긴 숨소리를 흉내 냈다. 비는 점점 세졌고, 거실의 문은 바람 없이 천천히 열렸다.',
          '잡음 사이로 한 문장이 또렷하게 섞였다. “아직 다 못 들었잖아.”',
        ],
      },
      { id: 'ep-2', title: '2화. 비어 있는 식탁', accessState: 'locked', accessLabel: '잠금', preview: '아무도 없는 식탁 위에 매일 같은 수저가 하나씩 더 놓인다.', body: ['잠금 회차입니다.'] },
      { id: 'ep-3', title: '3화. 문 뒤의 목소리', accessState: 'locked', accessLabel: '구독 공개', preview: '닫힌 문은 침묵보다 더 정확하게 누군가의 존재를 증명한다.', body: ['맛보기 공개 회차입니다.'] },
    ],
  },
  {
    id: 'gravity-bloom',
    title: '중력의 꽃',
    authorName: '유안',
    coverImageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80',
    status: 'completed',
    isAdultOnly: false,
    isCommentEnabled: true,
    category: 'GL',
    filterTags: ['완결', '맛보기 공개'],
    tags: ['청춘', '우정너머', '성장'],
    blurb: '서로를 가장 잘 안다고 믿었던 두 사람이 졸업을 앞두고 전혀 다른 감정을 알아차리게 된다.',
    summary: '서로를 가장 잘 안다고 믿었던 두 사람이 졸업을 앞두고 전혀 다른 감정을 알아차리게 된다.',
    intro:
      '감정의 미묘한 결이 중요한 작품이라면 회차 제목과 댓글 톤이 작품 경험에 큰 영향을 줍니다. 완결작이므로 처음 들어온 독자가 안정적으로 정주행 결정을 내릴 수 있게 구조를 잡았습니다.',
    commentPreview:
      '“두 사람의 감정이 급하게 소비되지 않아서 더 좋았어요. 마지막 화까지 읽고 다시 첫 화를 보게 되는 작품입니다.”',
    episodes: [
      {
        id: 'ep-1',
        title: '1화. 마지막 봄',
        accessState: 'free',
        accessLabel: '무료',
        preview: '졸업을 앞둔 봄, 늘 같다고 믿었던 두 사람의 거리감이 처음으로 달라진다.',
        body: [
          '유안은 체육관 뒤편 계단에서 꽃잎이 바람에 쓸리는 소리를 들었다. 매년 같은 봄이 왔다고 생각했지만, 올해의 공기는 이상할 만큼 가벼웠다.',
          '가장 가까운 친구가 옆에 앉았을 뿐인데 이상하게도 손끝이 먼저 긴장했다. 두 사람 사이에는 이름 붙이지 못한 질문이 천천히 자라고 있었다.',
          '졸업식 연습 종이 울리자, 그들은 동시에 일어섰지만 같은 속도로 걷지는 못했다.',
        ],
      },
      { id: 'ep-2', title: '2화. 서로의 거리', accessState: 'locked', accessLabel: '구독 공개', preview: '가까울수록 말하기 어려운 감정이 있다.', body: ['구독자 공개 회차입니다.'] },
      { id: 'ep-3', title: '3화. 흔들리는 계절', accessState: 'free', accessLabel: '무료', preview: '멈추지 않는 계절 속에서, 두 사람은 처음으로 같은 방향을 다시 본다.', body: ['완결작 공개 회차입니다.'] },
    ],
  },
]

export const artworks: ExploreArtwork[] = applyArtworkBackendMap(baseArtworks)

export function getArtworkById(id: string) {
  return artworks.find((artwork) => artwork.id === id)
}
