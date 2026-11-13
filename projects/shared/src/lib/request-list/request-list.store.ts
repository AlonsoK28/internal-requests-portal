import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, Subject, switchMap, tap, debounceTime, distinctUntilChanged, combineLatest, startWith } from 'rxjs';
import { ApiRequest, RequestQuery, RequestStatus, RequestType } from '../api/api.models';
import { RequestsApiService } from '../api/requests-api.service';

const statuses: RequestStatus[] = ['pending', 'approved', 'rejected'];
const types: RequestType[] = ['equipment', 'access', 'travel'];

@Injectable()
export class RequestListStore {
  private readonly api = inject(RequestsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchChanges = new Subject<string>();
  private readonly reload = new Subject<void>();
  private defaultStatus: RequestStatus | '' = '';

  readonly items = signal<readonly ApiRequest[]>([]);
  readonly totalCount = signal<number | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly search = signal('');
  readonly status = signal<RequestStatus | ''>('');
  readonly type = signal<RequestType | ''>('');

  start(defaultStatus: RequestStatus | '' = ''): void {
    this.defaultStatus = defaultStatus;
    if (defaultStatus && !this.route.snapshot.queryParamMap.has('status')) {
      void this.router.navigate([], { relativeTo: this.route, queryParams: { status: defaultStatus },
        queryParamsHandling: 'merge', replaceUrl: true });
    }

    this.searchChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(q => this.updateParams({ q: q || null, _page: null }));

    combineLatest([this.route.queryParamMap, this.reload.pipe(startWith(undefined))]).pipe(
      map(([params]) => {
        const page = Number(params.get('_page'));
        const limit = Number(params.get('_limit'));
        const status = params.get('status');
        const type = params.get('type');
        const q = params.get('q') ?? '';
        this.page.set(Number.isSafeInteger(page) && page > 0 ? page : 1);
        this.limit.set(Number.isSafeInteger(limit) && limit > 0 ? limit : 10);
        this.search.set(q);
        this.status.set(status === 'all' ? ''
          : statuses.includes(status as RequestStatus) ? status as RequestStatus : defaultStatus);
        this.type.set(types.includes(type as RequestType) ? type as RequestType : '');
        return { _page: this.page(), _limit: this.limit(), q: q || undefined,
          status: this.status() || undefined, type: this.type() || undefined } satisfies RequestQuery;
      }),
      tap(() => { this.loading.set(true); this.error.set(false); }),
      switchMap(query => this.api.list(query).pipe(
        catchError(() => { this.error.set(true); return of(null); }),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(result => {
      this.loading.set(false);
      this.items.set(result?.items ?? []);
      this.totalCount.set(result?.totalCount ?? null);
    });
  }

  setSearch(value: string): void { this.search.set(value); this.searchChanges.next(value.trim()); }
  setStatus(value: RequestStatus | ''): void {
    this.updateParams({ status: value || (this.defaultStatus ? 'all' : null), _page: null });
  }
  setType(value: RequestType | ''): void { this.updateParams({ type: value || null, _page: null }); }
  setPage(pageIndex: number, pageSize: number): void {
    this.updateParams({ _page: pageIndex + 1, _limit: pageSize });
  }
  retry(): void { this.reload.next(); }

  applyUpdatedRequest(updated: ApiRequest): void {
    const current = this.items();
    if (!current.some(item => item.id === updated.id)) return;
    if (this.status() && updated.status !== this.status()) {
      this.items.set(current.filter(item => item.id !== updated.id));
      this.totalCount.update(count => count === null ? null : Math.max(0, count - 1));
      return;
    }
    this.items.set(current.map(item => item.id === updated.id ? updated : item));
  }

  private updateParams(params: Record<string, string | number | null>): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: params, queryParamsHandling: 'merge' });
  }
}
