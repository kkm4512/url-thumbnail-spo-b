import { readBody } from "h3"
import nodeFetch from "node-fetch"

export const runtime = "nodejs"


export default defineEventHandler(async (event) => {
  const { url: instaUrl } = await readBody(event)


  if (!instaUrl || !instaUrl.includes("instagram.com")) {
    return { error: "올바른 Instagram URL을 입력해주세요." }
  }
    const res = await nodeFetch(instaUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; SM-G973N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-User": "?1",
        "Sec-Fetch-Dest": "document",
        "Cache-Control": "max-age=0",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
      }
    })

    const html = await res.text();

    let { title, author, tags } = parseFromHtml(html);   

    return {
        title,
        author,
        tags
    }
})

/**
 * 인스타그램 HTML에서
 * - 제목: "컴공이 잠을 못 잤을 때"
 * - 작성자: ssongsogong
 * - 태그: #대학생 #동아대 ...
 * 를 추출해서 반환
 */
function parseFromHtml(html) {
  let title = "";
  let author = "";
  let tags = [];

  // -----------------------------
  // 1) 작성자(author) 추출
  //    <meta name="twitter:title" content="소공소공 (@ssongsogong) • Instagram 릴스">
  // -----------------------------
  const twitterTitleMatch = html.match(
    /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i
  );

  if (twitterTitleMatch) {
    const twitterTitle = decodeHtmlEntities(twitterTitleMatch[1]);
    // 예: "소공소공 (@ssongsogong) • Instagram 릴스"
    const atMatch = twitterTitle.match(/@([0-9A-Za-z_.]+)/);
    if (atMatch) {
      author = atMatch[1]; // ssongsogong
    }
  }

  // -----------------------------
  // 2) 설명(캡션) 추출
  //    <meta name="description" content="837 likes, ... &quot;컴공이 잠을 못 잤을 때 ... #태그들&quot;. ">
  // -----------------------------
  let description = "";

  // 우선 name="description" 시도
  const descMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
  );

  if (descMatch) {
    description = decodeHtmlEntities(descMatch[1]);
  } else {
    // 혹시 없으면 og:description도 시도
    const ogDescMatch = html.match(
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
    );
    if (ogDescMatch) {
      description = decodeHtmlEntities(ogDescMatch[1]);
    }
  }

  // -----------------------------
  // 3) description에서 "캡션 부분"만 추출
  //    837 likes, ... : "컴공이 잠을 못 잤을 때
  //
  //    #대학생 #동아대 ..."
  // -----------------------------
  if (description) {
    // 큰따옴표 안쪽 내용만 가져오기
    const quoteMatch = description.match(/"([^"]+)"/);
    let caption = "";

    if (quoteMatch) {
      caption = quoteMatch[1]; // 컴공이 잠을 못 잤을 때 \n\n#대학생 ...
    } else {
      // 혹시 따옴표가 없으면 전체를 캡션으로 사용
      caption = description;
    }

    // 줄 기준으로 쪼개서, 첫 줄(또는 첫 non-empty 줄)을 제목으로 사용
    const lines = caption.split(/\r?\n/).map((l) => l.trim());
    const nonEmptyLines = lines.filter((l) => l.length > 0);

    if (nonEmptyLines.length > 0) {
      title = nonEmptyLines[0]; // "컴공이 잠을 못 잤을 때"
    }

    // -----------------------------
    // 4) 해시태그 추출: #로 시작하는 토큰들
    // -----------------------------
    tags = extractTags(html, caption);
  }

  return { title, author, tags };
}

function extractTags(html, caption) {
  caption = caption ?? "";

  // 1) caption에서 태그 추출 시도
  let tags = caption.match(/#[^\s#]+/g);

  if (!tags || tags.length === 0) {
    // 2) caption 실패 → og:title 에서 재시도
    const ogTitleMatch = html.match(
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
    );

    if (ogTitleMatch) {
      const ogTitle = decodeHtmlEntities(ogTitleMatch[1]);
      const ogTags = ogTitle.match(/#[^\s#]+/g);

      if (ogTags && ogTags.length > 0) tags = ogTags;
    }
  }

  // 3) 최종 판정
  if (!tags || tags.length === 0) {
    return ["#태그가없어요!"];
  }

  // 4) 태그가 있으면 앞 3개만 반환
  return tags.slice(0, 3);
}


function decodeHtmlEntities(str = "") {
  if (!str) return str;

  return str
    // hex: &#x1F60E;
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    // dec: &#128526;
    .replace(/&#([0-9]+);/g, (_, dec) =>
      String.fromCodePoint(parseInt(dec, 10))
    )
    // 기본 HTML 엔티티
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'");
}
