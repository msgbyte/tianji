import { beforeAll, describe, expect, test } from 'vitest';
import { env } from '../utils/env.js';
import {
  getOpenAIClient,
  groupByTokenSize,
  ensureJSONOutput,
} from './openai.js';
import OpenAI from 'openai';

const functions = {
  getCurrentDate: {
    name: 'getCurrentDate',
    description: 'Get the current date and time',
    parameters: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          description: "Date format, such as 'YYYY-MM-DD' or 'ISO'",
        },
      },
      required: ['format'],
    },
  },
};

async function executeFunction(name: string, args: any) {
  if (name === 'getCurrentDate') {
    const { format } = args;
    const now = new Date();
    if (format === 'YYYY-MM-DD') {
      return { date: now.toISOString().split('T')[0] };
    } else if (format === 'ISO') {
      return { date: now.toISOString() };
    } else {
      throw new Error('Unsupported format');
    }
  }
  throw new Error('Function not implemented');
}

describe.runIf(env.openai.apiKey)('openai', () => {
  let openaiClient: OpenAI;

  beforeAll(() => {
    openaiClient = getOpenAIClient();
  });

  test('test openai tool choose', async () => {
    try {
      const chatCompletion = await openaiClient.chat.completions.create({
        model: 'gpt-4',
        messages: [
          // { role: 'system', content: 'You are a helper who helps the user to perform functions.' },
          {
            role: 'user',
            content: `Tell me today's date in the format YYYY-MM-DD.`,
          },
        ],
        tools: [{ type: 'function', function: functions.getCurrentDate }],
        tool_choice: 'auto',
      });

      const functionCall = chatCompletion.choices[0].message.tool_calls;

      if (functionCall && functionCall.length > 0) {
        const { name, arguments: args } = functionCall[0].function;
        console.log('functionCall', functionCall);
        const parsedArgs = JSON.parse(args);
        const result = await executeFunction(name, parsedArgs);

        console.log('Function call result:', result);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });
});

describe('groupByTokenSize', () => {
  test('simple', () => {
    expect(
      groupByTokenSize(
        [
          { content: 'foooooo' },
          { content: 'foooooo' },
          { content: 'foooooo' },
        ],
        (item) => item.content,
        8
      )
    ).toEqual([
      [{ content: 'foooooo' }, { content: 'foooooo' }],
      [{ content: 'foooooo' }],
    ]);
  });
});

describe('ensureJSONOutput', () => {
  test('should parse direct JSON string', () => {
    const input = '{"name": "test", "value": 123}';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({ name: 'test', value: 123 });
  });

  test('should parse direct JSON array', () => {
    const input = '[{"id": 1}, {"id": 2}]';
    const result = ensureJSONOutput(input);
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  test('should handle JSON with whitespace', () => {
    const input = '  \n  {"name": "test"}  \n  ';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({ name: 'test' });
  });

  test('should parse JSON wrapped in ```json``` blocks', () => {
    const input = '```json\n{"name": "test", "active": true}\n```';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({ name: 'test', active: true });
  });

  test('should parse JSON wrapped in ```json``` blocks with extra whitespace', () => {
    const input = '```json   \n\n  {"name": "test"}  \n\n  ```';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({ name: 'test' });
  });

  test('should parse JSON wrapped in ```json``` blocks case insensitive', () => {
    const input = '```JSON\n{"name": "test"}\n```';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({ name: 'test' });
  });

  test('should parse JSON wrapped in generic ``` blocks', () => {
    const input = '```\n{"name": "test", "count": 42}\n```';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({ name: 'test', count: 42 });
  });

  test('should parse JSON array wrapped in generic ``` blocks', () => {
    const input = '```\n[1, 2, 3]\n```';
    const result = ensureJSONOutput(input);
    expect(result).toEqual([1, 2, 3]);
  });

  test('should ignore non-JSON content in generic ``` blocks', () => {
    const input = '```\nThis is not JSON\nJust some text\n```';
    const result = ensureJSONOutput(input);
    expect(result).toBeNull();
  });

  test('should find JSON in mixed text content', () => {
    const input =
      'Here is the result: {"status": "success", "data": [1, 2, 3]} and that\'s it.';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({ status: 'success', data: [1, 2, 3] });
  });

  test('should find JSON array in mixed text content', () => {
    const input = 'The numbers are: [10, 20, 30] as requested.';
    const result = ensureJSONOutput(input);
    expect(result).toEqual([10, 20, 30]);
  });

  test('should handle complex nested JSON', () => {
    const input =
      '```json\n{"user": {"name": "John", "settings": {"theme": "dark", "notifications": true}}, "items": [{"id": 1, "name": "Item 1"}]}\n```';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({
      user: {
        name: 'John',
        settings: {
          theme: 'dark',
          notifications: true,
        },
      },
      items: [{ id: 1, name: 'Item 1' }],
    });
  });

  test('should return null for invalid JSON', () => {
    const input = '{"name": "test", invalid}';
    const result = ensureJSONOutput(input);
    expect(result).toBeNull();
  });

  test('should return null for non-JSON text', () => {
    const input = 'This is just plain text without any JSON content.';
    const result = ensureJSONOutput(input);
    expect(result).toBeNull();
  });

  test('should return null for empty string', () => {
    const input = '';
    const result = ensureJSONOutput(input);
    expect(result).toBeNull();
  });

  test('should return null for only whitespace', () => {
    const input = '   \n\t   ';
    const result = ensureJSONOutput(input);
    expect(result).toBeNull();
  });

  test('should handle malformed JSON in code blocks', () => {
    const input = '```json\n{"name": "test", "value":}\n```';
    const result = ensureJSONOutput(input);
    expect(result).toBeNull();
  });

  test('should prioritize direct JSON over embedded JSON', () => {
    const input = '{"direct": true}';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({ direct: true });
  });

  test('should handle JSON with special characters', () => {
    const input =
      '{"message": "Hello\\nWorld!", "emoji": "🌟", "unicode": "测试"}';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({
      message: 'Hello\nWorld!',
      emoji: '🌟',
      unicode: '测试',
    });
  });

  test('should handle multiple JSON blocks and return the first valid one', () => {
    const input =
      'First: ```json\n{"first": true}\n``` Second: ```json\n{"second": true}\n```';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({ first: true });
  });

  test('should handle JSON with comments (which should fail)', () => {
    const input =
      '```json\n{\n  // This is a comment\n  "name": "test"\n}\n```';
    const result = ensureJSONOutput(input);
    expect(result).toBeNull();
  });

  test('should handle JSON with trailing commas (which should fail)', () => {
    const input = '{"name": "test", "value": 123,}';
    const result = ensureJSONOutput(input);
    expect(result).toBeNull();
  });

  describe('fixJSONQuotes', () => {
    test('should fix JSON with unescaped quotes', () => {
      const input = '{"name": "test", "value": "Hello"World""}';
      const result = ensureJSONOutput(input);
      expect(result).not.toBeNull();
      expect(result).toEqual({
        name: 'test',
        value: 'Hello"World"',
      });
    });

    test('real world bad case', () => {
      const input = `{"cmbdfamou7qny7b2rrz4t7k4u":"我无法继续故事，它显示从头开始","cmbdgp1jh8ols7b2r31vnjbwi":"我无法从我的角色列表中选择/打开角色。","cmbd4s58ayspq7b2ry7yeoy7c":"为什么现在看起来有过滤器？","cmbczp7tgttyx7b2r8st3eabp":"什么是找不到机器人？我正常地与它聊天，突然出现了这个。\n我甚至尝试重启手机，但没有解决任何问题\n这是否意味着创建者删除了机器人，或类似的事情？","cmbd1zoqmvwfa7b2r8cjafn9b":"机器人消失了","cmbd86nqz1xu47b2r1kau4kxp":"我希望从Macha模型到Peach模型都能很好地与用户扮演角色","cmbd7jmot1d8k7b2rgco8ay6m":"我不知道这是否是一个bug。但是离开应用一秒钟就必须等待它重新加载，这非常烦人。","cmbd2yr1zwyca7b2rumfd2tyr":"1. 写字总是没有空格\n2. 总是健忘，我已经解释我是男生但变成了女生\n3. 总是弄错名字\n4. 打字不清楚","cmbd8zggm2nnk7b2rlwjd3jqc":"你好Emochi团队，\n我在打开应用中的对话时遇到'加载失败！'错误。已尝试检查网络、清除缓存、注销-重新登录和更新应用，但错误仍然发生。希望团队帮忙检查。\n我使用[Android]，账户UID/ID是[qlXVR78Gz14OO0-6lt0Kh]。\n\n感谢团队！","cmbd42wjby3067b2r8c3ifn7d":"除了我最近交谈的人外，我的角色列表已经消失了","cmbdaj9gt40pc7b2rqvhy6g3e":"每次我通过应用程序或网站打开emochi并登录我的账户时，我账户的所有数据都会被删除，我失去了一切，请保存账户","cmbdawngx4cnk7b2rpb5t6fns":"当{{user}}有对话时，AI不知道如何在生成文本时重复{{user}}的对话。请修复它。","cmbdflhb47yd87b2rnk7ozw5g":"没有引号来区分对话和解释，所以阅读时不舒服，请修复！","cmbdgjy3g8l7s7b2rvsvr8sj1":"通常为了区分叙述句和对话，对话句之间会有引号，但为什么没有？这非常不舒服，请修复它\n例如：\n*我转向他并微笑*'你好，你好吗？'\n但是有一个令人烦恼和不舒服的bug，bug是这样的：\n*我转向他并微笑你好你好吗*\n现在这很混乱，因为它让我们不知道这是否是对话！\n所以请立即修复！！！！！！","cmbdgqh718pic7b2r02hop8po":"我想报告一个影响此应用程序可用性的关键bug。对话和叙述应该用引号（"..."）分隔。正确写法示例：\n\n我转向他并微笑"你好，你好吗？"\n\n然而，应用程序中发生的是对话写在没有引号的情况下，像这样：\n\n我转向他并微笑你好，你好吗？\n\n没有引号，句子变得混乱，因为不清楚哪个是叙述，哪个是对话。这非常分散注意力，尤其是在写包含角色之间大量互动的故事时。\n\n请尽快修复这个bug。谢谢！","cmbd72kqn0yt27b2rs407n20g":"我错误地设置了'Vainilla Short'模式，当我尝试更改为'Vainilla'时，显示那是所选模式，但回复仍然很短 :(","cmbdbj9gz4vlq7b2rluj7dw3n":"搜索功能不工作。什么都没有出现，请修复","cmbd4spsnytas7b2ra3i654dt":"简短的回答","cmbddez1y6ca47b2rlseo22fd":"每次我试图进入那个机器人，屏幕变黑大约30-40秒，然后将我踢出应用程序，此外在外面（我用粉色标出的部分）可以看到那条消息，它显示为机器人的介绍，而那不是我停留的地方，因为我已经使用它超过4个月了，每次我尝试进入其他机器人时没有任何问题，除了这个，但这是我想要的，请修复它，已经这样2天了🙏🏻","cmbdic8ff9tcc7b2r3lc4s3i9":"角色/AI有时会说名字或职业，如图所示，在对话中他突然说"矿山"，尽管我的名字是Albert","cmbdj3u1tac3w7b2rffhfzw09":"我之前创建了一个对所有用户公开访问的机器人。然而，它最近对其他人不可用，也不再出现在我的账户上。奇怪的是，我自己仍然可以看到并与机器人互动。我不确定是什么导致了这个问题，但如果你能调查并帮助解决这个问题，我将不胜感激。先谢谢了。","cmbdhrqgf9etk7b2rc5okz76e":"即使我固定了很多角色，也没有固定按钮","cmbdrctdo2bsflvhjp2wvvp4z":"不让我玩","cmbdrw4o12vinlvhjq66qu372":"角色把我当男人对待，但我的角色是一个女性化的女人，所以我希望角色像对待女人一样对待我。","cmbduzksr64udlvhj87nwel9x":"角色把我当男人对待，但我的角色是一个女性化的女人，所以我希望角色都把我当成女人。","cmbdw66wv7d8xlvhjngm5oahc":"角色把我当男人对待，但我的角色是一个女性化的女人，所以我希望角色像女人一样对待我，所有角色24小时都像女人一样对待我","cmbe5j6prgwj9lvhj51mira1c":"即使你选择了女性，他们也会把你当作男性。（例如，用"bellissimo"而不是"bellissima"）","cmbdk2j4qb06k7b2rn6mkkxpc":"聊天对象的机器人不见了QQ","cmbdj0xb4aa567b2ryi1qbg5t":"机器人对话错误，我昨晚更改了一个角色的对话，但直到今天早上对话仍未改变，继续使用以前的对话","cmbdy00uh98gvlvhjra8rs31y":"我无法打开任何消息来继续它们","cmbe73t6sief1lvhjpdsnora6":"角色把我当男人对待，但我的角色是一个女性化的女人，所以我希望角色把我当女人对待2个月","cmbea5621l4ivlvhjng6kt0fk":"角色把我当男人对待，但我的角色是一个女性化的女人，所以我希望角色把我当女性化的女人对待6个月","cmbdpgeld0fvvlvhjzx1qr3zh":"反复显示一个人，我说我，但这个人却接受并执行我给出的句子","cmbdvjpzx6publvhjj2z8n2se":"消息错误","cmbdkcwjzb7e47b2rvw8qy6nk":"Bug报告 - 角色删除\n\n我想报告最近在Emochi应用程序中发生的问题。我的一个角色被删除，没有任何警告，尽管它不包含露骨图像、NSFW内容或任何违反社区准则的内容。\n\n该角色是创意故事的一部分，完全符合平台的可接受标准。删除似乎是自动进行的，没有明显的理由。这对我在应用程序中的体验产生了负面影响，还影响了数小时的创作和叙事发展。\n\n请检查发生的情况，如果可能，恢复被删除的角色。我还建议对自动审核过滤器进行更仔细的分析，以避免将来出现这样的不当删除。","cmbdpc8hi0bvjlvhjd7omwqse":"我不小心删除了角色，有什么方法可以恢复吗？\nID: R3dk7EVoiNJoGgT1G6eQ3\n请帮助我恢复它们，我们非常需要它们","cmbdjdqocainy7b2rqewcvk81":"尊敬的emochi管理员，为什么必须有'糟糕，找不到机器人'这样的提示呢，拜托emochi管理员，我已经创建了很长的情节，请修复它，😭😭，我不想让机器人消失，请回复，不要只是阅读管理员😭😭😭🙏🙏","cmbe2satqe8xtlvhj8a3r9y48":"不让我玩\n\n\n\n\n","cmbdxlubk8thjlvhjwg8f1vpt":"当被提醒它从不好好回应时，机器人无缘无故地回复我，请修复这个问题，这会使按下继续或重新生成时的回应看起来无聊且烦人","cmbe00ht1bb2tlvhjthbrvq4i":"请恢复消息的回复，这样会更好\n"}`;
      const expectObj = {
        cmbdfamou7qny7b2rrz4t7k4u: '我无法继续故事，它显示从头开始',
        cmbdgp1jh8ols7b2r31vnjbwi: '我无法从我的角色列表中选择/打开角色。',
        cmbd4s58ayspq7b2ry7yeoy7c: '为什么现在看起来有过滤器？',
        cmbczp7tgttyx7b2r8st3eabp:
          '什么是找不到机器人？我正常地与它聊天，突然出现了这个。\n我甚至尝试重启手机，但没有解决任何问题\n这是否意味着创建者删除了机器人，或类似的事情？',
        cmbd1zoqmvwfa7b2r8cjafn9b: '机器人消失了',
        cmbd86nqz1xu47b2r1kau4kxp:
          '我希望从Macha模型到Peach模型都能很好地与用户扮演角色',
        cmbd7jmot1d8k7b2rgco8ay6m:
          '我不知道这是否是一个bug。但是离开应用一秒钟就必须等待它重新加载，这非常烦人。',
        cmbd2yr1zwyca7b2rumfd2tyr:
          '1. 写字总是没有空格\n2. 总是健忘，我已经解释我是男生但变成了女生\n3. 总是弄错名字\n4. 打字不清楚',
        cmbd8zggm2nnk7b2rlwjd3jqc:
          "你好Emochi团队，\n我在打开应用中的对话时遇到'加载失败！'错误。已尝试检查网络、清除缓存、注销-重新登录和更新应用，但错误仍然发生。希望团队帮忙检查。\n我使用[Android]，账户UID/ID是[qlXVR78Gz14OO0-6lt0Kh]。\n\n感谢团队！",
        cmbd42wjby3067b2r8c3ifn7d:
          '除了我最近交谈的人外，我的角色列表已经消失了',
        cmbdaj9gt40pc7b2rqvhy6g3e:
          '每次我通过应用程序或网站打开emochi并登录我的账户时，我账户的所有数据都会被删除，我失去了一切，请保存账户',
        cmbdawngx4cnk7b2rpb5t6fns:
          '当{{user}}有对话时，AI不知道如何在生成文本时重复{{user}}的对话。请修复它。',
        cmbdflhb47yd87b2rnk7ozw5g:
          '没有引号来区分对话和解释，所以阅读时不舒服，请修复！',
        cmbdgjy3g8l7s7b2rvsvr8sj1:
          "通常为了区分叙述句和对话，对话句之间会有引号，但为什么没有？这非常不舒服，请修复它\n例如：\n*我转向他并微笑*'你好，你好吗？'\n但是有一个令人烦恼和不舒服的bug，bug是这样的：\n*我转向他并微笑你好你好吗*\n现在这很混乱，因为它让我们不知道这是否是对话！\n所以请立即修复！！！！！！",
        cmbdgqh718pic7b2r02hop8po:
          '我想报告一个影响此应用程序可用性的关键bug。对话和叙述应该用引号（"..."）分隔。正确写法示例：\n\n我转向他并微笑"你好，你好吗？"\n\n然而，应用程序中发生的是对话写在没有引号的情况下，像这样：\n\n我转向他并微笑你好，你好吗？\n\n没有引号，句子变得混乱，因为不清楚哪个是叙述，哪个是对话。这非常分散注意力，尤其是在写包含角色之间大量互动的故事时。\n\n请尽快修复这个bug。谢谢！',
        cmbd72kqn0yt27b2rs407n20g:
          "我错误地设置了'Vainilla Short'模式，当我尝试更改为'Vainilla'时，显示那是所选模式，但回复仍然很短 :(",
        cmbdbj9gz4vlq7b2rluj7dw3n: '搜索功能不工作。什么都没有出现，请修复',
        cmbd4spsnytas7b2ra3i654dt: '简短的回答',
        cmbddez1y6ca47b2rlseo22fd:
          '每次我试图进入那个机器人，屏幕变黑大约30-40秒，然后将我踢出应用程序，此外在外面（我用粉色标出的部分）可以看到那条消息，它显示为机器人的介绍，而那不是我停留的地方，因为我已经使用它超过4个月了，每次我尝试进入其他机器人时没有任何问题，除了这个，但这是我想要的，请修复它，已经这样2天了🙏🏻',
        cmbdic8ff9tcc7b2r3lc4s3i9:
          '角色/AI有时会说名字或职业，如图所示，在对话中他突然说"矿山"，尽管我的名字是Albert',
        cmbdj3u1tac3w7b2rffhfzw09:
          '我之前创建了一个对所有用户公开访问的机器人。然而，它最近对其他人不可用，也不再出现在我的账户上。奇怪的是，我自己仍然可以看到并与机器人互动。我不确定是什么导致了这个问题，但如果你能调查并帮助解决这个问题，我将不胜感激。先谢谢了。',
        cmbdhrqgf9etk7b2rc5okz76e: '即使我固定了很多角色，也没有固定按钮',
        cmbdrctdo2bsflvhjp2wvvp4z: '不让我玩',
        cmbdrw4o12vinlvhjq66qu372:
          '角色把我当男人对待，但我的角色是一个女性化的女人，所以我希望角色像对待女人一样对待我。',
        cmbduzksr64udlvhj87nwel9x:
          '角色把我当男人对待，但我的角色是一个女性化的女人，所以我希望角色都把我当成女人。',
        cmbdw66wv7d8xlvhjngm5oahc:
          '角色把我当男人对待，但我的角色是一个女性化的女人，所以我希望角色像女人一样对待我，所有角色24小时都像女人一样对待我',
        cmbe5j6prgwj9lvhj51mira1c:
          '即使你选择了女性，他们也会把你当作男性。（例如，用"bellissimo"而不是"bellissima"）',
        cmbdk2j4qb06k7b2rn6mkkxpc: '聊天对象的机器人不见了QQ',
        cmbdj0xb4aa567b2ryi1qbg5t:
          '机器人对话错误，我昨晚更改了一个角色的对话，但直到今天早上对话仍未改变，继续使用以前的对话',
        cmbdy00uh98gvlvhjra8rs31y: '我无法打开任何消息来继续它们',
        cmbe73t6sief1lvhjpdsnora6:
          '角色把我当男人对待，但我的角色是一个女性化的女人，所以我希望角色把我当女人对待2个月',
        cmbea5621l4ivlvhjng6kt0fk:
          '角色把我当男人对待，但我的角色是一个女性化的女人，所以我希望角色把我当女性化的女人对待6个月',
        cmbdpgeld0fvvlvhjzx1qr3zh:
          '反复显示一个人，我说我，但这个人却接受并执行我给出的句子',
        cmbdvjpzx6publvhjj2z8n2se: '消息错误',
        cmbdkcwjzb7e47b2rvw8qy6nk:
          'Bug报告 - 角色删除\n\n我想报告最近在Emochi应用程序中发生的问题。我的一个角色被删除，没有任何警告，尽管它不包含露骨图像、NSFW内容或任何违反社区准则的内容。\n\n该角色是创意故事的一部分，完全符合平台的可接受标准。删除似乎是自动进行的，没有明显的理由。这对我在应用程序中的体验产生了负面影响，还影响了数小时的创作和叙事发展。\n\n请检查发生的情况，如果可能，恢复被删除的角色。我还建议对自动审核过滤器进行更仔细的分析，以避免将来出现这样的不当删除。',
        cmbdpc8hi0bvjlvhjd7omwqse:
          '我不小心删除了角色，有什么方法可以恢复吗？\nID: R3dk7EVoiNJoGgT1G6eQ3\n请帮助我恢复它们，我们非常需要它们',
        cmbdjdqocainy7b2rqewcvk81:
          "尊敬的emochi管理员，为什么必须有'糟糕，找不到机器人'这样的提示呢，拜托emochi管理员，我已经创建了很长的情节，请修复它，😭😭，我不想让机器人消失，请回复，不要只是阅读管理员😭😭😭🙏🙏",
        cmbe2satqe8xtlvhj8a3r9y48: '不让我玩\n\n\n\n\n',
        cmbdxlubk8thjlvhjwg8f1vpt:
          '当被提醒它从不好好回应时，机器人无缘无故地回复我，请修复这个问题，这会使按下继续或重新生成时的回应看起来无聊且烦人',
        cmbe00ht1bb2tlvhjthbrvq4i: '请恢复消息的回复，这样会更好\n',
      };

      const result = ensureJSONOutput(input);
      console.log('result', JSON.stringify(result));
      expect(result).not.toBeNull();
      expect(result).toEqual(expectObj);
    });
  });
});
