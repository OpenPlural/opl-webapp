import { AfterViewInit, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LocalStorageService } from '../../../services/LocalStorageService';
import { SyncService } from '../../../services/SyncService';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Misrouted } from '../../../components/misrouted/misrouted';
import { PopupPageContainer } from '../../../components/container/popup-page-container/popup-page-container';
import { VerticalCenter } from '../../../components/vertical-center/vertical-center';
import { IconButton } from '../../../components/icon-button/icon-button';
import { MarkdownBox } from '../../../components/markdown-box/markdown-box';
import { Chart } from 'chart.js';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { closeDialog, openDialog } from '../../../util/CommonFunctions';
import { MemberSelector } from '../../../components/selector/member-selector/member-selector';
import { MemberId } from '../../../services/model/Member';
import { MemberListItem } from '../../../components/list-item/member-list-item/member-list-item';
import { makePollAnswer } from '../../../services/model/Poll';
import { nullableField } from '../../../util/NullString';
import { truncateCurrentDate } from '../../../util/DateTruncate';
import { Pager } from '../../../components/pager/pager';
import { ToggleIconButton } from '../../../components/toggle-icon-button/toggle-icon-button';
import { PollAnswers } from '../../../components/poll-answers/poll-answers';

const chartColors = [
  '#1f77b4',
  '#ff7f0e',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#bcbd22',
  '#17becf',
  '#ffbb78',
  '#98df8a',
  '#ff9896',
  '#c5b0d5',
  '#ff44ff',
  '#dbdb8d',
  '#8833ff',
];
const yesNoVetoColors = ['#2ca02c', '#ff7f0e', '#d62728'];
const emptyColor = ['#7f7f7f'];

@Component({
  selector: 'app-poll',
  imports: [
    Misrouted,
    PopupPageContainer,
    VerticalCenter,
    IconButton,
    MarkdownBox,
    TranslatePipe,
    MemberSelector,
    MemberListItem,
    Pager,
    ToggleIconButton,
    PollAnswers,
  ],
  templateUrl: './poll.html',
})
export class Poll implements AfterViewInit {
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly syncService = inject(SyncService);

  private readonly yes = toSignal<string>(
    this.translate.getStreamOnTranslationChange('polls.labels.yes'),
    {
      initialValue: null,
    },
  );
  private readonly no = toSignal<string>(
    this.translate.getStreamOnTranslationChange('polls.labels.no'),
    {
      initialValue: null,
    },
  );
  private readonly veto = toSignal<string>(
    this.translate.getStreamOnTranslationChange('polls.labels.veto'),
    {
      initialValue: null,
    },
  );

  protected readonly id = toSignal(
    this.route.paramMap.pipe(
      map((params) => {
        const id = params.get('id');
        return id ? BigInt(id) : null;
      }),
    ),
    { initialValue: null },
  );

  protected readonly chooseVoteMember = signal<boolean>(false);
  protected readonly voteMember = signal<MemberId | null>(null);
  protected readonly voteMemberObject = computed(() => {
    const id = this.voteMember();
    if (!id) return null;
    return this.localStorageService.members().find((m) => m.id === id) || null;
  });

  protected readonly selectedAnswerTab = signal<number>(0);

  protected readonly poll = computed(() => {
    const id = this.id();
    return this.localStorageService.polls().find((p) => p.id === id);
  });
  protected readonly answers = computed(() => {
    const id = this.id();
    return this.localStorageService.pollAnswers().filter((a) => a.pollId === id);
  });
  protected readonly options = computed(() => {
    const poll = this.poll();
    if (!poll) return [];

    if (poll.customOptions) {
      return poll.customOptions;
    } else {
      const yes = this.yes();
      const no = this.no();
      const veto = this.veto();
      if (!yes || !no || !veto) return [];

      return [yes, no, veto];
    }
  });
  protected readonly richOptions = computed(() => {
    const poll = this.poll();
    if (!poll) return [];

    const options = this.options();
    const colors = poll.customOptions ? chartColors : yesNoVetoColors;
    return options.map((option, index) => {
      const color = colors[index] || null;
      return { option, index, color };
    });
  });
  protected readonly answerCounts = computed(() => {
    const poll = this.poll();
    if (!poll) return [];

    const options = [...this.options()];
    if (!poll.customOptions) {
      options.push("abstain");
    }
    const answers = this.answers();

    return options.map((_, index) => answers.filter((a) => Number(a.answer) === index).length);
  });
  protected readonly answerPercentages = computed(() => {
    const poll = this.poll();
    if (!poll) return [];

    const counts = [...this.answerCounts()];
    if (!poll.customOptions) {
      counts.pop();
    }
    const total = counts.reduce((sum, count) => sum + count, 0);
    if (total === 0) return counts.map(() => 0);
    return counts.map((count) => Math.round((count / total) * 100));
  });

  private readonly chart = signal<Chart | null>(null);

  constructor() {
    effect(() => {
      const chart = this.chart();
      const poll = this.poll();
      if (!chart || !poll) return;

      let colors: string[];
      if (poll.customOptions) {
        colors = chartColors;
      } else {
        colors = yesNoVetoColors;
      }

      const options = this.options();
      const answerCounts = [...this.answerCounts()];
      if (!poll.customOptions) {
        answerCounts.pop();
      }
      if (!answerCounts.some((count) => count > 0)) {
        answerCounts[0] = 1; // Avoid invisible graph
        colors = emptyColor;
      }

      chart.data.labels = options;
      chart.data.datasets[0].backgroundColor = colors;
      chart.data.datasets[0].data = answerCounts;
      chart.update();
    });
  }

  ngAfterViewInit() {
    const canvas = document.getElementById('pollGraph') as HTMLCanvasElement;
    this.chart.set(
      new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: [],
          datasets: [
            {
              backgroundColor: [],
              data: [],
            },
          ],
        },
        options: {},
      }),
    );
  }

  protected nextOption(mod: number) {
    this.selectedAnswerTab.update(i => {
      if (mod > 0 && i < this.options().length - 1) {
        return i + 1;
      }
      if (mod < 0 && i > 0) {
        return i - 1;
      }
      return i;
    });
  }

  protected editPoll() {
    this.router.navigate(['app', 'poll-edit', this.id()]);
  }

  protected voteWith(selection: MemberId[]) {
    this.chooseVoteMember.set(false);
    this.voteMember.set(selection[0]);
    openDialog('voteOptionPrompt');
  }

  protected async submitVote(index: number) {
    const pollId = this.id();
    const memberId = this.voteMember();
    if (!pollId || !memberId) return;

    const comment = (document.getElementById('voteComment') as HTMLTextAreaElement).value;
    const oldAnswer = this.localStorageService
      .pollAnswers()
      .find((pa) => pa.pollId === pollId && pa.memberId === memberId);
    if (oldAnswer) {
      const answer = {
        ...oldAnswer,
        answer: BigInt(index),
        comment: nullableField(comment),
        updatedAt: truncateCurrentDate(),
      };
      await this.localStorageService.updatePollAnswer(answer);
    } else {
      const answer = makePollAnswer(pollId, memberId, BigInt(index), nullableField(comment));
      await this.localStorageService.addPollAnswer(answer);
    }
    closeDialog('voteOptionPrompt');
    this.syncService.fullSync();
  }

  protected readonly openDialog = openDialog;
}
