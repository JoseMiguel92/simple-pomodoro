import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Phase } from '../timer.model';
import { TimerDial } from './timer-dial';

const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

describe('TimerDial', () => {
  let fixture: ComponentFixture<TimerDial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TimerDial] }).compileComponents();
    fixture = TestBed.createComponent(TimerDial);
    await render();
  });

  async function render(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function setInputs(inputs: {
    progress?: number;
    remaining?: string;
    phase?: Phase;
  }): Promise<void> {
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    await render();
  }

  function progressRing(): SVGCircleElement {
    return fixture.nativeElement.querySelector('.dial-progress') as SVGCircleElement;
  }

  function offset(): number {
    return Number(progressRing().getAttribute('stroke-dashoffset'));
  }

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should size the dash pattern to the circumference', () => {
    expect(Number(progressRing().getAttribute('stroke-dasharray'))).toBeCloseTo(CIRCUMFERENCE, 5);
  });

  it('should show the full ring at progress 0', async () => {
    await setInputs({ progress: 0 });
    expect(offset()).toBe(0);
  });

  it('should show half a ring at progress 0.5', async () => {
    await setInputs({ progress: 0.5 });
    expect(offset()).toBeCloseTo(CIRCUMFERENCE / 2, 5);
  });

  it('should show an empty ring at progress 1', async () => {
    await setInputs({ progress: 1 });
    expect(offset()).toBeCloseTo(CIRCUMFERENCE, 5);
  });

  it('should follow the progress input on every change', async () => {
    await setInputs({ progress: 0.25 });
    expect(offset()).toBeCloseTo(CIRCUMFERENCE * 0.25, 5);

    await setInputs({ progress: 0.75 });
    expect(offset()).toBeCloseTo(CIRCUMFERENCE * 0.75, 5);

    await setInputs({ progress: 0 });
    expect(offset()).toBe(0);
  });

  it('should clamp progress outside the 0..1 range', async () => {
    await setInputs({ progress: -0.5 });
    expect(offset()).toBe(0);

    await setInputs({ progress: 1.5 });
    expect(offset()).toBeCloseTo(CIRCUMFERENCE, 5);
  });

  it('should render the remaining time exactly as given', async () => {
    await setInputs({ remaining: '24:59' });
    expect(fixture.nativeElement.textContent).toContain('24:59');

    await setInputs({ remaining: '05:00' });
    expect(fixture.nativeElement.textContent).toContain('05:00');
  });

  it('should label the current phase in Spanish', async () => {
    await setInputs({ phase: 'focus' });
    expect(fixture.nativeElement.textContent).toContain('Concentración');

    await setInputs({ phase: 'break' });
    expect(fixture.nativeElement.textContent).toContain('Descanso');
  });

  it('should mark the ring with the palette class of the current phase', async () => {
    await setInputs({ phase: 'focus' });
    expect(progressRing().classList).toContain('stroke-focus');
    expect(progressRing().classList).not.toContain('stroke-break');

    await setInputs({ phase: 'break' });
    expect(progressRing().classList).toContain('stroke-break');
    expect(progressRing().classList).not.toContain('stroke-focus');
  });
});
