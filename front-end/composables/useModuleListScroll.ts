import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

type UseModuleListScrollOptions = {
  visibleCount?: number;
};

export function useModuleListScroll(options: UseModuleListScrollOptions = {}) {
  const visibleCount = Math.max(1, options.visibleCount ?? 5);

  const isModuleListOpen = ref(true);
  const moduleListInner = ref<HTMLElement | null>(null);
  const moduleListScroll = ref<HTMLElement | null>(null);

  let resizeObserver: ResizeObserver | null = null;

  const cleanupResizeObserver = () => {
    resizeObserver?.disconnect();
    resizeObserver = null;
  };

  const setModuleViewportHeight = () => {
    if (typeof window === "undefined") return;
    const scrollContainer = moduleListScroll.value;
    if (!scrollContainer) return;

    const listItems = Array.from(
      scrollContainer.querySelectorAll<HTMLElement>("li")
    );

    if (!listItems.length) {
      scrollContainer.style.removeProperty("height");
      scrollContainer.style.removeProperty("maxHeight");
      return;
    }

    const visibleItems = listItems.slice(0, visibleCount);

    const listElement = scrollContainer.querySelector("ol");
    let gap = 0;
    if (listElement) {
      const styles = window.getComputedStyle(listElement);
      const gapString =
        styles.rowGap && styles.rowGap !== "normal"
          ? styles.rowGap
          : styles.gap;
      const parsedGap = parseFloat(gapString ?? "0");
      gap = Number.isFinite(parsedGap) ? parsedGap : 0;
    }

    const totalHeight =
      visibleItems.reduce(
        (height, item) => height + item.getBoundingClientRect().height,
        0
      ) +
      gap * Math.max(visibleItems.length - 1, 0);

    const boundedHeight = Math.max(0, Math.ceil(totalHeight));
    // Use max-height to allow native overflow while avoiding hard lock on height.
    scrollContainer.style.maxHeight = `${boundedHeight}px`;
    scrollContainer.style.removeProperty("height");
  };

  const setupResizeObserver = () => {
    if (typeof ResizeObserver === "undefined") return;
    const scrollContainer = moduleListScroll.value;
    if (!scrollContainer) return;

    cleanupResizeObserver();

    resizeObserver = new ResizeObserver(() => {
      setModuleViewportHeight();
    });

    resizeObserver.observe(scrollContainer);
  };

  // const toggleModuleList = () => {
  //   const panel = moduleListInner.value;
  //   if (!panel) {
  //     isModuleListOpen.value = !isModuleListOpen.value;
  //     return;
  //   }

  //   const currentHeight = panel.scrollHeight;

  //   if (isModuleListOpen.value) {
  //     panel.style.height = `${currentHeight}px`;
  //     panel.style.opacity = "1";
  //     requestAnimationFrame(() => {
  //       panel.style.height = "0px";
  //       panel.style.opacity = "0";
  //     });
  //   } else {
  //     panel.style.height = "0px";
  //     panel.style.opacity = "0";
  //     requestAnimationFrame(() => {
  //       const targetHeight = panel.scrollHeight || currentHeight;
  //       panel.style.height = `${targetHeight}px`;
  //       panel.style.opacity = "1";
  //     });
  //   }

  //   isModuleListOpen.value = !isModuleListOpen.value;
  // };


const toggleModuleList = () => {
  const panel = moduleListInner.value;
  if (!panel) {
    isModuleListOpen.value = !isModuleListOpen.value;
    return;
  }

  // Ensure we have an up-to-date measurement before toggling.
  const currentHeight = panel.scrollHeight;

  if (isModuleListOpen.value) {
    // closing: animate from current height -> 0
    panel.style.height = `${currentHeight}px`;
    panel.style.opacity = "1";
    // force a frame then collapse
    requestAnimationFrame(() => {
      panel.style.height = "0px";
      panel.style.opacity = "0";
    });
  } else {
    // opening: need to measure target height while content can size itself.
    // Temporarily make height 'auto' so scrollHeight reflects content,
    // then set height to 0 and animate to the measured height.
    panel.style.height = "auto";
    const targetHeight = panel.scrollHeight;

    // Start from 0 so the animation runs
    panel.style.height = "0px";
    panel.style.opacity = "0";

    // On the next frame, animate to the measured height
    requestAnimationFrame(() => {
      panel.style.height = `${targetHeight}px`;
      panel.style.opacity = "1";
    });
  }

  // flip the state; transitionend handler will set height to auto after open completes
  isModuleListOpen.value = !isModuleListOpen.value;
};

  const handlePanelTransitionEnd = (event: TransitionEvent) => {
    if (event.propertyName !== "height") return;
    const panel = moduleListInner.value;
    if (!panel) return;

    if (isModuleListOpen.value) {
      panel.style.height = "auto";
    }
  };

  const refreshModuleListViewport = () => {
    if (typeof window === "undefined") return;
    requestAnimationFrame(() => setModuleViewportHeight());
  };

  onMounted(() => {
    if (typeof window === "undefined") return;

    const panel = moduleListInner.value;
    if (panel) {
      panel.style.height = "auto";
      panel.style.opacity = "1";
      panel.addEventListener("transitionend", handlePanelTransitionEnd);
    }

    nextTick(() => {
      requestAnimationFrame(() => {
        setModuleViewportHeight();
        setupResizeObserver();
      });
    });

    window.addEventListener("resize", setModuleViewportHeight);
  });

  onBeforeUnmount(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", setModuleViewportHeight);
    }

    const panel = moduleListInner.value;
    if (panel) {
      panel.removeEventListener("transitionend", handlePanelTransitionEnd);
    }

    cleanupResizeObserver();
  });

  return {
    isModuleListOpen,
    moduleListInner,
    moduleListScroll,
    toggleModuleList,
    refreshModuleListViewport,
    visibleCount,
  };
}
