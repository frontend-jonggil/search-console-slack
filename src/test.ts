import { google } from "googleapis";
import { JWT } from "google-auth-library";
import dotenv from "dotenv";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dotenv.config();

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Seoul");

export const schema = [
  {
    serviecName: "모네플",
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL!,
    privateKey: process.env.GOOGLE_PRIVATE_KEY!,
    projects: [
      {
        siteUrl: "https://cashdoc.moneple.com",
        searchConsoleUrl:
          "https://search.google.com/u/2/search-console?resource_id=https%3A%2F%2Fcashdoc.moneple.com%2F",
        projectName: "캐시닥 커뮤니티",
      },
      {
        siteUrl: "https://unnie.moneple.com",
        searchConsoleUrl:
          "https://search.google.com/u/2/search-console/index?resource_id=https%3A%2F%2Funnie.moneple.com%2F",
        projectName: "언니의 파우치 커뮤니티",
      },
      {
        siteUrl: "https://trost.moneple.com",
        searchConsoleUrl:
          "https://search.google.com/u/1/search-console?resource_id=https%3A%2F%2Fgmboss.moneple.com%2F",
        projectName: "트로스트 커뮤니티",
      },
      {
        siteUrl: "https://gmboss.moneple.com",
        searchConsoleUrl:
          "https://search.google.com/u/0/search-console?resource_id=https%3A%2F%2Fgmboss.moneple.com%2F",
        projectName: "과민보스 커뮤니티",
      },
      {
        siteUrl: "https://geniet.moneple.com",
        searchConsoleUrl:
          "https://search.google.com/u/2/search-console?resource_id=https%3A%2F%2Fgeniet.moneple.com%2F",
        projectName: "지니어트 커뮤니티",
      },
      {
        siteUrl: "https://cashwalklabs.moneple.com",
        searchConsoleUrl:
          "https://search.google.com/u/2/search-console?resource_id=https%3A%2F%2Fcashwalklabs.moneple.com%2F",
        projectName: "글로벌 캐시워크 커뮤니티",
      },
      {
        siteUrl: "https://cashwalk.moneple.com",
        searchConsoleUrl:
          "https://search.google.com/u/1/search-console?resource_id=https%3A%2F%2Fcashwalk.moneple.com%2F",
        projectName: "캐시워크 커뮤니티",
      },
      {
        siteUrl: "https://winspec.moneple.com",
        searchConsoleUrl:
          "https://search.google.com/u/1/search-console?resource_id=https%3A%2F%2Fwinspec.moneple.com%2F",
        projectName: "윈스펙 커뮤니티",
      },
    ],
  },
  // {
  //   serviecName: "링커리어",
  //   clientEmail: process.env.GOOGLE_CLIENT_EMAIL!,
  //   privateKey: process.env.GOOGLE_PRIVATE_KEY!,
  //   projects: [
  //     {
  //       siteUrl: "https://linkareer.com/",
  //       searchConsoleUrl:
  //         "https://search.google.com/search-console?resource_id=https%3A%2F%2Flinkareer.com%2F",
  //       projectName: "링커리어",
  //     },
  //     {
  //       siteUrl: "https://community.linkareer.com/",
  //       searchConsoleUrl:
  //         "https://search.google.com/search-console?resource_id=https%3A%2F%2Fcommunity.linkareer.com%2F",
  //       projectName: "링커리어 - 커뮤니티",
  //     },
  //     {
  //       siteUrl: "https://cbt-community.linkareer.com/",
  //       searchConsoleUrl:
  //         "https://search.google.com/search-console?resource_id=sc-domain%3Acbt-community.linkareer.com",
  //       projectName: "링커리어 - 시험 정보방",
  //     },
  //   ],
  // },
];

interface FetchSearchData {
  clientEmail: string;
  privateKey: string;
  siteUrl: string;
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
}

async function fetchSearchData({
  clientEmail,
  privateKey,
  siteUrl,
  startDate,
  endDate,
}: FetchSearchData) {
  const auth = new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });

  const searchconsole = google.searchconsole({ version: "v1", auth });

  const searchAnalytics = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: startDate.format("YYYY-MM-DD"),
      endDate: endDate.format("YYYY-MM-DD"),
      dimensions: ["date"],
      type: "web",
      dataState: "all",
    },
  });

  return searchAnalytics.data.rows || [];
}

interface TestSearchConsole {
  clientEmail: string;
  privateKey: string;
  siteUrl: string;
  searchConsoleUrl: string;
  projectName: string;
  serviceName: string;
}

export async function testSearchConsole({
  clientEmail,
  privateKey,
  siteUrl,
  searchConsoleUrl,
  projectName,
  serviceName,
}: TestSearchConsole) {
  // 이번 주 데이터 (3일 전부터 9일 전까지)
  const currentEndDate = dayjs().tz().subtract(3, "day");
  const currentStartDate = currentEndDate.subtract(6, "day");

  // 지난 주 데이터 (10일 전부터 16일 전까지)
  const previousEndDate = currentStartDate.subtract(1, "day");
  const previousStartDate = previousEndDate.subtract(6, "day");

  const [currentWeekData, previousWeekData] = await Promise.all([
    fetchSearchData({
      clientEmail,
      privateKey,
      siteUrl,
      startDate: currentStartDate,
      endDate: currentEndDate,
    }),
    fetchSearchData({
      clientEmail,
      privateKey,
      siteUrl,
      startDate: previousStartDate,
      endDate: previousEndDate,
    }),
  ]);

  // 주간 합계 계산
  const currentWeekSummary = { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const previousWeekSummary = {
    clicks: 0,
    impressions: 0,
    ctr: 0,
    position: 0,
  };

  currentWeekData.forEach((row) => {
    currentWeekSummary.clicks += row.clicks || 0;
    currentWeekSummary.impressions += row.impressions || 0;
    currentWeekSummary.ctr += row.ctr || 0;
    currentWeekSummary.position += row.position || 0;
  });

  previousWeekData.forEach((row) => {
    previousWeekSummary.clicks += row.clicks || 0;
    previousWeekSummary.impressions += row.impressions || 0;
    previousWeekSummary.ctr += row.ctr || 0;
    previousWeekSummary.position += row.position || 0;
  });

  // 평균값 계산
  currentWeekSummary.ctr = currentWeekSummary.ctr / currentWeekData.length;
  currentWeekSummary.position =
    (currentWeekSummary.position ?? 0) / currentWeekData.length;
  previousWeekSummary.ctr = previousWeekSummary.ctr / previousWeekData.length;
  previousWeekSummary.position =
    previousWeekSummary.position / previousWeekData.length;

  // 증감률 계산
  const changes = {
    clicks: (
      ((currentWeekSummary.clicks - previousWeekSummary.clicks) /
        previousWeekSummary.clicks) *
      100
    ).toFixed(1),
    impressions: (
      ((currentWeekSummary.impressions - previousWeekSummary.impressions) /
        previousWeekSummary.impressions) *
      100
    ).toFixed(1),
    ctr: (
      ((currentWeekSummary.ctr - previousWeekSummary.ctr) /
        previousWeekSummary.ctr) *
      100
    ).toFixed(1),
    position: (
      ((previousWeekSummary.position - currentWeekSummary.position) /
        previousWeekSummary.position) *
      100
    ).toFixed(1),
  };

  return {
    currentStartDate,
    currentEndDate,
    previousEndDate,
    previousStartDate,
    currentWeekSummary,
    previousWeekSummary,
    changes,
    searchConsoleUrl,
    projectName,
    serviceName,
  };
}

// testSearchConsole();
