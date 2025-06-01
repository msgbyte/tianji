import { describe, expect, test } from 'vitest';
import {
  basicSurveyClassifyPromptToken,
  buildSurveyClassifyPrompt,
  buildSurveyTranslationPrompt,
} from './survey.js';
import {
  calcOpenAIToken,
  ensureJSONOutput,
  getOpenAIClient,
  modelName,
  requestOpenAI,
} from '../openai.js';

describe('buildSurveyClassifyPrompt', () => {
  test('prompt token', () => {
    const { prompt } = buildSurveyClassifyPrompt([], []);

    expect(calcOpenAIToken(prompt)).toBe(basicSurveyClassifyPromptToken);
  });

  test.runIf(Boolean(process.env.TEST_SURVEY_PROMPT))(
    'test prompt effect',
    {
      timeout: 30_000,
    },
    async () => {
      const { prompt, question } = buildSurveyClassifyPrompt(
        [
          { id: 'fooo', content: 'Hello, World!' },
          { id: 'baar', content: 'Hello, Tianji!' },
        ],
        []
      );

      const res = await getOpenAIClient().chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: question,
          },
        ],
        response_format: {
          type: 'json_object',
        },
      });

      const json = ensureJSONOutput(res.choices[0].message.content ?? '');
      expect(json).not.toBeNull();
    }
  );
});

describe('buildSurveyTranslationPrompt', () => {
  test.runIf(Boolean(process.env.TEST_SURVEY_PROMPT))(
    'test prompt effect',
    {
      timeout: 60_000,
    },
    async () => {
      const { prompt, question } = buildSurveyTranslationPrompt(
        [
          { id: 'fooo', content: 'Hello, World!' },
          { id: 'baar', content: 'Hello, Tianji!' },
          { id: 'baaz', content: 'Some bad case with "wrap with qutoe"' },
        ],
        'fr-FR'
      );

      const res = await getOpenAIClient().chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: question,
          },
        ],
        response_format: {
          type: 'json_object',
        },
      });

      const json = ensureJSONOutput(res.choices[0].message.content ?? '');
      expect(json).not.toBeNull();
    }
  );

  test.runIf(Boolean(process.env.TEST_SURVEY_PROMPT)).skip(
    'test prompt effect with real world bad case',
    {
      timeout: 300_000,
    },
    async () => {
      const { prompt, question } = buildSurveyTranslationPrompt(
        [
          {
            id: 'cmbd5yc8izwio7b2r56z1phvf',
            content:
              'Tidak ada tanda petik untuk memisahkan antara percakapan dan penjelasan jadi susah dimengerti dan tidak nyaman saat membacanya, tolong segera diperbaiki🙏🏻',
          },
          {
            id: 'cmbd71fam0xts7b2ruo0rnyfx',
            content:
              'Bueno cada vez que me salgo de esta App me sale que intente de nuevo como si no tuviera señal',
          },
          {
            id: 'cmbd9v3js3f667b2r6w9vh6tz',
            content: 'bug tulisannya abu semua dan tidak ada tanda kutip " nya',
          },
          {
            id: 'cmbda4ia83n0g7b2rzfocjgqp',
            content:
              'Inició sesión en la aplicación y me dice error de token, entró a la página web, y me permite entrar. Solucinen eso por favor',
          },
          {
            id: 'cmbdb1hcg4gte7b2rbf6lcoko',
            content:
              'Eu fiz o plano mensal plus, e tive acesso a novos tipos de chat. Mais em qualquer personagem que vou conversar além do modo Vanilla, são respondidos por mim. Eu não consigo usar outros modelos sem que a Ia escreva por mim.',
          },
          {
            id: 'cmbdbopf6507c7b2r37dhavvn',
            content:
              'aplikasi nya suka keluar sendiri, padahal lagi asik main.. Perbaiki dong developer.. Saya jadi gak nyaman.',
          },
          {
            id: 'cmbcyjjz9suv57b2rzopn7k64',
            content: 'Aunque tenga buen internet, no me deja acceder a nada',
          },
          {
            id: 'cmbczjo0ktpgr7b2r5yxhgxvu',
            content:
              'Her girip çıktığımda giriş mesajı sıfırlanıyor. Eski sürüm gelmesini istiyorum',
          },
          {
            id: 'cmbd17kgav3vq7b2r6e6lpyz4',
            content: 'Aplikasi keluar sendiri \nPerbaiki hari ini',
          },
          {
            id: 'cmbd44egqy4kq7b2rjqh5svh2',
            content: 'It doesn’t want to work ',
          },
          {
            id: 'cmbd4gxm4yh587b2rp1mc0wqq',
            content: 'Me saca de la aplicación y los anuncios se traban \n',
          },
          {
            id: 'cmbd7n4tm1g7y7b2r3qkmurve',
            content:
              'Aplikasi keluar sendiri terus menerus \nPerbaiki agar tidak keluar sendiri \n',
          },
          {
            id: 'cmbde4nyz6vqm7b2rsfysc770',
            content:
              'Sering keluar dari aplikasi dan sering iklan mendadak, perubahan pada bahasa',
          },
          {
            id: 'cmbdg66x88c8m7b2rzzgkob7y',
            content:
              'ketika Emochi saya sudah dipakai lebih dari 4 jam, itu selalu nge bug dan keluar aplikasi Emochi sendiri, saya sudah menghapus canche dan uninstall lalu tetap sama selalu keluar sendiri, tolong bantuannya',
          },
          {
            id: 'cmbd1jgxovf2m7b2rhaw4k4ad',
            content: 'No me deja entrar con mi cuenta de google',
          },
          {
            id: 'cmbd90uhz2ovc7b2rtg2kmngc',
            content:
              'Hello Emochi team,  \nI\'m getting a "Failed to load!" error when opening a conversation in the app. I have tried clearing cache, switching networks, logging out/in, and updating the app, but the issue still persists.  \nI’m using [Android], and my account UID/ID is [qlXVR78Gz14OO0-6lt0Kh].\n\nThank you!',
          },
          {
            id: 'cmbdankh244v07b2rkwkdrj77',
            content:
              'En la aplicación, no me deja iniciar sesión, y en la página web si. Necesito ayuda',
          },
          {
            id: 'cmbd2ta2awsxs7b2rvwmkq5o5',
            content:
              'Me pone mensajes con partes en español e ingles siendo que mi configuración está en español ',
          },
          {
            id: 'cmbd0xbgzuuiw7b2rmv510dnd',
            content:
              "App is constantly timing out, especially after ads. An ad will come up, and I'll press the x and the screen will start flickering, ultimately closing the app all together and sometimes not letting me back in. Or it'll time out right as an ad comes up. Recently, I'll send a message and it'll glitch out. It's gotten progressively worse and has been happening to my other friends who have it too. Pleaseee fix",
          },
          {
            id: 'cmbd2f90dwe5y7b2rxmf7kz4l',
            content: 'No me deja chatear, está rarisimo y como que se traba.',
          },
          {
            id: 'cmbd3l78vxkda7b2rftfdxor4',
            content:
              'Estou tentando editar a minha introdução e corpo da conversa, já editei o texto, atualizei milhares de vezes e não atualiza. Já sai do app, voltei..e nada muda.',
          },
          {
            id: 'cmbd83sfz1vba7b2r3l6pm1ye',
            content:
              'Não carrega as mensagens, não tá funcionando direito, sempre tá saindo de lógica horrível pra mevher, não pega nada de vez enquanto, ',
          },
          {
            id: 'cmbd2hk5bwgp07b2rotzvlvgc',
            content:
              'Por qué cuando pongo mis preferencias del personaje me sale lo contrario a lo que pedí ',
          },
          {
            id: 'cmbd1ygmuvv0e7b2r69gjjg8b',
            content:
              'As falas estão vindo em inglês,eu só quero em português \n',
          },
          {
            id: 'cmbdh5f5a8zha7b2riscdhgeq',
            content:
              'Добрый день. Вел рассказ, и резко ответы персонажа в данном диалоге стал на иностранном языке. Помогите пожалуйста исправить эту ошибку',
          },
          {
            id: 'cmbd3c5aexbom7b2rv6l8zv8j',
            content: 'I am unable to select any of my chats',
          },
          {
            id: 'cmbd7bh43168q7b2rdji944xq',
            content:
              'Cuando quiero mandar algún mensaje al personaje me sale que no se editó o algo parecido, incluso cuando apenas terminó de crear un personaje y quiero mandar un mensaje, no puedo debido a esto y la verdad es molesto. Ya que ni siquiera puedo hablar con el personaje',
          },
          {
            id: 'cmbd89vru20qm7b2r56h5xu23',
            content:
              'Hola! Lamento la molestia pero al momento de editar un mensaje este no suele mandarse o no me permite picar aquel botón, trate de cerrar y reiniciar mi teléfono creyendo que era un fallo mio pero aun así no puedo y es incomodo. Aparte de que el puntero en el momento de editar aquel mensaje no puede moverse y tienes que borrar todo para poder editarlo aunque como decía antes, no te deja. Se los agradecería mucho si lo revisaran por que es molesto. ',
          },
          {
            id: 'cmbdfamou7qny7b2rrz4t7k4u',
            content: 'Hikaye davem ettiremiyorum en başı yazıyo ',
          },
          {
            id: 'cmbdgp1jh8ols7b2r31vnjbwi',
            content: "I can't select/open characters from my character list.",
          },
          {
            id: 'cmbd4s58ayspq7b2ry7yeoy7c',
            content: 'Por que ahora parece que tiene filtro?',
          },
          {
            id: 'cmbczp7tgttyx7b2r8st3eabp',
            content:
              'O que seria não encontrar o bot? Eu estava conversando com ele normalmente e de repente apareceu isso.\n Eu já tentei até reiniciar meu celular, mas não resolveu nada\nIsso significa que o criador deletou o bot, ou algo assim?',
          },
          {
            id: 'cmbd1zoqmvwfa7b2r8cjafn9b',
            content: '机器人消失了',
          },
          {
            id: 'cmbd86nqz1xu47b2r1kau4kxp',
            content:
              'Saya harap dari model Macha sampai peach dapat memerankan persona dengan pengguna dengan baik ',
          },
          {
            id: 'cmbd7jmot1d8k7b2rgco8ay6m',
            content:
              'Nao sei se é um bug. Mas é bem irritante sair por 1 segundo do app e ter  que esperar ele fazer load de novo.',
          },
          {
            id: 'cmbd2yr1zwyca7b2rumfd2tyr',
            content:
              '1. kao nulis selalu dempet ga di spasi\n2. selalu pelupa masa aku udah di jelasin aku jadi cowok tapi malah jadi cewek\n3. selalu salah nama\n4. ngetiknya ga jelas',
          },
          {
            id: 'cmbd8zggm2nnk7b2rlwjd3jqc',
            content:
              'Chào Emochi team,  \nTôi đang gặp lỗi "Failed to load!" khi mở cuộc hội thoại trong ứng dụng. Đã thử kiểm tra mạng, xoá cache, đăng xuất - đăng nhập lại và cập nhật ứng dụng nhưng lỗi vẫn xảy ra. Mong team kiểm tra giúp.  \nTôi dùng [Android], UID/ID tài khoản là [qlXVR78Gz14OO0-6lt0Kh].\n\nCảm ��n team!',
          },
          {
            id: 'cmbd42wjby3067b2r8c3ifn7d',
            content:
              'Những danh sách nhân vật của tôi đã biến mất ngoại trừ người tôi nói chuyện gần nhất',
          },
          {
            id: 'cmbdaj9gt40pc7b2rqvhy6g3e',
            content:
              'toda vez que eu abro o emochi seja pelo aplicativo ou pelo site e logo na minha conta todos os dados da minha conta são excluídos e eu perco tudo, por favor salvem as contas',
          },
          {
            id: 'cmbdawngx4cnk7b2rpb5t6fns',
            content:
              "When {{user}} has dialogue, AI does not know how to repeat {{user}}'s dialogue when generating text. Please fix it.",
          },
          {
            id: 'cmbdflhb47yd87b2rnk7ozw5g',
            content:
              'Tidak ada tanda petik untuk memisahkan antara percakapan dan penjelasan jadi tidak nyaman saat membacanya, tolong diperbaiki ya!',
          },
          {
            id: 'cmbdgjy3g8l7s7b2rvsvr8sj1',
            content:
              "Usually to differentiate narrative sentences and dialogues there are quotation marks between the dialogue sentences, but why aren't there any? It's very uncomfortable, please fix it \nfor example : \n*I turned to him and smiled* \"hello how are you?\"\nBut instead there is a bug that is annoying and uncomfortable, the bug is like this:\n*I turned to him and smiled hello how are you*\nnow that's confusing, because it makes us not know whether it's a dialogue or not!\nSO PLEASE FIX IT IMMEDIATELY !!!!!!!!!!!!",
          },
          {
            id: 'cmbdgqh718pic7b2r02hop8po',
            content:
              'I would like to report a critical bug that interferes with the usability of this application. Dialogue and narration should be separated by quotation marks (“…”). Example of correct writing:\n\nI turned to him and smiled “Hello, how are you?”\n\nHowever, what happens in the application is that the dialogue is written without quotation marks, like this:\n\nI turned to him and smiled hello, how are you?\n\nWithout quotation marks, sentences become confusing because it is not clear which is narration and which is dialogue. This is very distracting, especially in writing stories that involve a lot of interaction between characters.\n\nPlease fix this bug soon. Thank you.!',
          },
          {
            id: 'cmbd72kqn0yt27b2rs407n20g',
            content:
              'Por error puse el modo "Vainilla Short" y cuando lo intenté cambiar a "Vainilla" me aparece que ese es el modelo seleccionado, pero las respuestas siguen siendo cortas :( ',
          },
          {
            id: 'cmbdbj9gz4vlq7b2rluj7dw3n',
            content: "The search doesn't work. Nothing appears, please fix",
          },
          {
            id: 'cmbd4spsnytas7b2ra3i654dt',
            content: 'Resposta crutas',
          },
          {
            id: 'cmbddez1y6ca47b2rlseo22fd',
            content:
              'Cada vez que trato de entrar a ese bot la pantalla se pone en negro aproximadamente 30-40 segundos y después me saca de la aplicación, aparte que por afuera (lo que subrayé de rosa) se ve ese mensaje que aparecía como la introducción del bot, y ahí no fue donde me quedé ya que yo llevo más de 4 meses con ese, y cada vez que trato de meterme a otros bots si me deja sin ningún problema, excepto a este, pero este es el que yo quiero, por favor arréglenlo, lleva así 2 días 🙏🏻\n',
          },
        ],
        'fr-FR'
      );

      const res = await getOpenAIClient().chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: question,
          },
        ],
        response_format: {
          type: 'json_object',
        },
      });

      const raw = res.choices[0].message.content ?? '';
      const json = ensureJSONOutput(raw);
      if (json === null) {
        console.log(raw);
      }
      expect(json).not.toBeNull();
    }
  );
});
