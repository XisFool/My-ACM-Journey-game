/* ============================================
   story.js — 游戏故事数据
   四个城市，四段旅程
   ============================================ */

export const STORY = {
  title: "我的ACM旅途",
  levels: [
    {
      id: 1,
      city: "南昌",
      cityEn: "NANCHANG",
      year: "2022",
      mission: "大学第一年，初识ACM",

      // 背景图路径
      bgImage: "js/Photo/Background/NanChang.webp",
      bgMusic: "js/Audio/MC.mp3",
      // 背景占位颜色（图片未加载时显示）
      bgColor: "#6a8faf",
      groundColor: "#5c4033",

      // 粒子效果: null | "snow" | "rain" | "leaves"
      particle: "snow",

      // 每个元素 = 地图里一个问号方块
      // memories 数组 = 这个方块里的多页内容（玩家点击翻页）
      // NPC 列表
      npcs: [
        {
          key: 'kirby',
          image: 'js/Photo/Other_character/Kirby.png',
          frameWidth: 30,
          frameHeight: 31,
          frameRate: 3,         // 1秒3帧
          afterBlock: 0,        // 放在第1个方块之后（0-indexed）
          dialog: 'will walk down this road until the end without looking back？',
          triggerTime: 2000,    // 停留2秒触发
        }
      ],

      memoryBlocks: [
        {
          memories: [
            {
              text: "22年刚入大学校园 第一次了解到ACM，看到学长们盯着屏幕敲代码，既陌生，又有一种莫名的向往",
              image: "js/Photo/NanChang_memo/A1.webp"
            },
            {
              text: "我在门口站了很久，最后还是走进去找了一台电脑坐下，第一个Hello World在学长的帮助下半小时才熟练，我觉得自己并无天赋，也很难想象自己能否到达学长一般的高度",
              image: "js/Photo/NanChang_memo/A2.webp"
            }
          ]
        },
        {
          memories: [
            {
              text: "开始入门的那段时间是快乐且漫长的，每天聊不完的天和写不完的题目",
              image: "js/Photo/NanChang_memo/B1.webp"
            },
            {
              text: "我的进步飞快，每天一下课就是跑机房刷题，同时也通过学长知道了xcpc是个团队比赛，我们学校在此最好的成绩是区域赛铜牌",
              image: "js/Photo/NanChang_memo/B2.webp"
            },
            {
              text: "每天都在写算法题",
              image: "js/Photo/NanChang_memo/B3.webp"
            }
          ]
        },
        {
          memories: [
            {
              text: "在学校的第一个冬天，室友和学长特别的合影",
              image: "js/Photo/NanChang_memo/C1.webp"
            },
            {
              text: "每天都能跟学长交流问题，学习到很多知识",
              image: "js/Photo/NanChang_memo/C2.webp"
            }
          ]
        }
      ]
    },
    {
      id: 2,
      city: "深圳",
      cityEn: "SHENZHEN",
      year: "2023",
      mission: "第一块属于我的ACM牌子",
      bgImage: "js/Photo/Background/ShenZheng.webp",
      bgMusic: "js/Audio/MC.mp3",
      bgColor: "#1a2a3a",
      groundColor: "#1c1c1c",
      particle: null,
      memoryBlocks: [
        {
          memories: [
            {
              text: "我们大一下意外获得了广东省赛名额，这是我们队伍第一次参加比赛的机会，深技大是我们的第一站",
              image: "js/Photo/ShenZheng_memo/A1.webp"
            },
            {
              text: "深技大的礼堂很大很豪华",
              image: "js/Photo/ShenZheng_memo/A2.webp"
            },
            {
              text: "我们仨",
              image: "js/Photo/ShenZheng_memo/A3.webp"
            }
          ]
        },
        {
          memories: [
            {
              text: "比赛中的位置",
              image: "js/Photo/ShenZheng_memo/B1.webp"
            },
            {
              text: "赛时被一道贪心题目卡住，我已经放弃看其他题目了。是我的俩位队友最后咬着牙给写过的。最终我们过了四题，运气好拿了'铜牌'，这是我们仨第一场组队的正式比赛就拿了牌，大家都很高兴(但是其实并不是铜牌，只能算奖励牌) ",
              image: "js/Photo/ShenZheng_memo/B2.webp"
            },
            {
              text: "赛后在礼堂颁奖时，我抱着这块牌子，同时也很羡慕学长挂在胸前的奖牌，心中那股劲也埋下种子",
              image: "js/Photo/ShenZheng_memo/B3.webp"
            }
          ]
        },
        {
          memories: [
            {
              text: "可能是缘分吧，第二次来到深技大是大二，但是比赛难度远大于之前，此时是CCPC深圳区域赛",
              image: "js/Photo/ShenZheng_memo/C1.webp"
            },
            {
              text: "我们这次依旧满怀信心向区域赛奖牌发起冲击",
              image: "js/Photo/ShenZheng_memo/C2.webp"
            },
            {
              text: "比赛题目难度远超想象，我们5个小时1道题目，肉体的疲惫加上题目对心底的打击让我们萌生退役的想法，一年的努力在这场功亏一篑，我也有点想要放弃的冲动",
              image: "js/Photo/ShenZheng_memo/C3.webp"
            }
          ]
        }
      ]
    },
    {
      id: 3,
      city: "桂林",
      cityEn: "GUILIN",
      year: "2023",
      mission: "和学长并肩作战",
      bgImage: "js/Photo/Background/GuiLin.webp",
      bgMusic: "js/Audio/MC.mp3",
      bgColor: "#2d4a3a",
      groundColor: "#3a4a28",
      particle: null,
      memoryBlocks: [
        {
          memories: [
            {
              text: "CCPC网络赛我们爆种拿到了区域赛名额，能有机会和学长一起旅游去到桂林区域赛同台竞技",
              image: "js/Photo/GuiLin_memo/A1.webp"
            },
            {
              text: "桂林日月塔",
              image: "js/Photo/GuiLin_memo/A2.webp"
            },
            {
              text: "桂林米粉香迷糊了(小黄鸭赞助的图片)",
              image: "js/Photo/GuiLin_memo/A3.webp"
            }
          ]
        },
        {
          memories: [
            {
              text: "CCPC桂林区域赛现场",
              image: "js/Photo/GuiLin_memo/B1.webp"
            },
            {
              text: "和学长队伍的合影",
              image: "js/Photo/GuiLin_memo/B2.webp"
            },
            {
              text: "桂电的比赛即将打响，热身赛很后悔没有好好逛桂电，桂电真的依山傍水，天雾蒙蒙的，美得离谱",
              image: "js/Photo/GuiLin_memo/B3.webp"
            }
          ]
        },
        {
          memories: [
            {
              text: "比赛依旧很艰难，我们5个小时2题结束，差一题就能得牌，最后一道铜牌题是暴力，但是我们却因为时间复杂度没敢上手写，赛后我很懊悔",
              image: "js/Photo/GuiLin_memo/C1.webp"
            },
            {
              text: "大二期间我们打了俩场区域赛，都没把握好机会，这次比赛结束之后，队伍之前的热情因为这些挫折开始慢慢消退，我对自己的能力也产生了怀疑，自己每次没法在遇到关键问题时候挺身而出",
              image: "js/Photo/GuiLin_memo/C2.webp"
            },
            {
              text: "在桂林最后一晚和日月塔的合照",
              image: "js/Photo/GuiLin_memo/C3.webp"
            }
          ]
        }
      ]
    },
    {
      id: 4,
      city: "重庆",
      cityEn: "CHONGQING",
      year: "2024",
      mission: "最后的战场，最重的奖牌",
      bgImage: "js/Photo/Background/ChongQin.webp",
      bgMusic: "js/Audio/wuxian_jinbu.mp3",
      bgColor: "#1e2530",
      groundColor: "#2a1e14",
      particle: null,
      memoryBlocks: [
        {
          memories: [
            {
              text: "网络赛失败，队伍的变阵以及教练告诉我CCPC重庆或许是我最后一次冲击区域赛奖牌的机会。我很难过，我的大学三年超一半时间都花在竞赛上面，我对这块牌子的执念超过了一切....",
              image: "js/Photo/ChongQin_memo/A1.webp"
            },
            {
              text: "机场下的重庆黄色出租车",
              image: "js/Photo/ChongQin_memo/A2.webp"
            },
            {
              text: "我们热身赛前一天，还在名宿里VP比赛。晚上我梦见自己拿到牌子，但是没敢跟队友说",
              image: "js/Photo/ChongQin_memo/A3.webp"
            }
          ]
        },
        {
          memories: [
            {
              text: "早上的重大",
              image: "js/Photo/ChongQin_memo/B1.webp"
            },
            {
              text: "这是我最后一次以学生身份站在这个赛场上。比赛开始前，我在椅子上坐了很久，平复自己的心情",
              image: "js/Photo/ChongQin_memo/B2.webp"
            },
            {
              text: "赛程开始不顺，我们在前俩个签到题目就wa了三发，但是之后状态上来了，每一题都是一遍就A，到最后的铜牌题，队友立马想到了关键解题点，我们把所有可能的样例都测试了一遍，提交的瞬间，看到屏幕变绿，手在颤抖",
              image: "js/Photo/ChongQin_memo/B3.webp"
            }
          ]
        },
        {
          memories: [
            {
              text: "感谢我的队友",
              image: "js/Photo/ChongQin_memo/C1.webp"
            },
            {
              text: "奖牌拿在手上的时候，我想起了南昌机房门口那个傻乎乎站了很久才敢走进去的自己。谢谢那个选择走进去的人",
              image: "js/Photo/ChongQin_memo/C2.webp"
            },
            {
              text: "我们仨",
              image: "js/Photo/ChongQin_memo/C3.webp"
            },
            {
              text: "第一时间跟学长分享了这波喜悦",
              image: "js/Photo/ChongQin_memo/C4.webp"
            },
            {
              text: "回南昌的飞机",
              image: "js/Photo/ChongQin_memo/C5.webp"
            }
          ]
        }
      ]
    }
  ]
};
