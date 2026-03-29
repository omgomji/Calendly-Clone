'use client';

type CreateMenuVariant = 'sidebar' | 'scheduling';

type CreateMenuPopoverProps = {
  variant: CreateMenuVariant;
  onCreateEventType: () => void;
  onCreateSingleUseLink: () => void;
  onCreateMeetingPoll: () => void;
  sidebarAdminTemplatesOpen: boolean;
  setSidebarAdminTemplatesOpen: (value: boolean) => void;
  sidebarMoreWaysOpen: boolean;
  setSidebarMoreWaysOpen: (value: boolean) => void;
};

type MenuItem = {
  title: string;
  subtitle: string;
  description: string;
  action: 'event-type' | 'single-use' | 'meeting-poll';
};

const baseEventTypeItems: MenuItem[] = [
  {
    title: 'One-on-one',
    subtitle: '1 host',
    description: 'Good for coffee chats, 1:1 interviews, etc.',
    action: 'event-type',
  },
  {
    title: 'Group',
    subtitle: '1 host',
    description: 'Webinars, online classes, etc.',
    action: 'event-type',
  },
  {
    title: 'Round robin',
    subtitle: 'Rotating hosts',
    description: 'Distribute meetings between team members',
    action: 'event-type',
  },
];

const collectiveItem: MenuItem = {
  title: 'Collective',
  subtitle: 'Multiple hosts',
  description: 'Panel interviews, group sales calls, etc.',
  action: 'event-type',
};

const oneOffItem: MenuItem = {
  title: 'One-off meeting',
  subtitle: '',
  description: 'Offer time outside your normal schedule',
  action: 'single-use',
};

const pollItem: MenuItem = {
  title: 'Meeting poll',
  subtitle: '',
  description: 'Let invitees vote on a time to meet',
  action: 'meeting-poll',
};

function ItemRow({ item, onSelect }: { item: MenuItem; onSelect: (action: MenuItem['action']) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.action)}
      className="w-full rounded-md px-2 py-1.5 text-left hover:bg-slate-50"
    >
      <div className="text-[14px] font-bold text-primary">{item.title}</div>
      {item.subtitle ? (
        <div className="text-[13px] font-medium text-slate-800">
          {item.subtitle}
          <span className="mx-1.5 text-slate-800">{'->'}</span>
          1 invitee{item.title === 'Group' ? 's' : ''}
        </div>
      ) : null}
      <div className="text-[12px] font-medium text-slate-500">{item.description}</div>
    </button>
  );
}

export default function CreateMenuPopover({
  variant,
  onCreateEventType,
  onCreateSingleUseLink,
  onCreateMeetingPoll,
  sidebarAdminTemplatesOpen,
  setSidebarAdminTemplatesOpen,
  sidebarMoreWaysOpen,
  setSidebarMoreWaysOpen,
}: CreateMenuPopoverProps) {
  const handleSelect = (action: MenuItem['action']) => {
    if (action === 'event-type') {
      onCreateEventType();
      return;
    }
    if (action === 'single-use') {
      onCreateSingleUseLink();
      return;
    }
    onCreateMeetingPoll();
  };

  return (
    <div className="relative z-50 w-[min(92vw,360px)] rounded-xl border border-slate-300 bg-white p-3 shadow-[0_8px_24px_rgba(16,42,67,0.14)]">
      {variant === 'sidebar' ? (
        <>
          <div className="px-2 py-2 text-[13px] font-bold text-slate-700">
            Event Types
          </div>

          <div className="space-y-1">
            {baseEventTypeItems.map((item) => (
              <ItemRow key={item.title} item={item} onSelect={handleSelect} />
            ))}
          </div>

          <div className="mt-2 border-t border-slate-200" />

          <button
            type="button"
            onClick={() => setSidebarAdminTemplatesOpen(!sidebarAdminTemplatesOpen)}
            className="mt-1 flex w-full items-center justify-between px-2 py-2 text-left"
          >
            <span className="text-[13px] font-bold text-slate-700">
              Admin Templates
            </span>
            <span className="material-symbols-outlined text-[24px] text-slate-800">
              {sidebarAdminTemplatesOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            </span>
          </button>

          {sidebarAdminTemplatesOpen ? (
            <div className="space-y-1">
              <ItemRow item={baseEventTypeItems[0]} onSelect={handleSelect} />
              <ItemRow item={baseEventTypeItems[1]} onSelect={handleSelect} />
            </div>
          ) : null}

          <div className="mt-2 border-t border-slate-200" />

          <button
            type="button"
            onClick={() => setSidebarMoreWaysOpen(!sidebarMoreWaysOpen)}
            className="mt-1 flex w-full items-center justify-between px-2 py-2 text-left"
          >
            <span className="text-[13px] font-bold text-slate-700">
              More ways to meet
            </span>
            <span className="material-symbols-outlined text-[24px] text-slate-800">
              {sidebarMoreWaysOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            </span>
          </button>

          {sidebarMoreWaysOpen ? (
            <div className="space-y-1">
              <ItemRow item={collectiveItem} onSelect={handleSelect} />
              <ItemRow item={oneOffItem} onSelect={handleSelect} />
              <ItemRow item={pollItem} onSelect={handleSelect} />
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="px-2 py-2 text-[13px] font-bold text-slate-500">
            Event type
          </div>

          <div className="space-y-1">
            {[...baseEventTypeItems, collectiveItem].map((item) => (
              <ItemRow key={item.title} item={item} onSelect={handleSelect} />
            ))}
          </div>

          <div className="mt-2 border-t border-slate-200" />

          <div className="px-2 py-2 text-[13px] font-bold text-slate-500">
            More ways to meet
          </div>

          <div className="space-y-1">
            <ItemRow item={oneOffItem} onSelect={handleSelect} />
            <ItemRow item={pollItem} onSelect={handleSelect} />
          </div>
        </>
      )}
    </div>
  );
}
