import { onBeforeUnmount, useTemplateRef, watch } from 'vue'

/**
 * 让 <dialog class="modal"> 由响应式状态驱动，并通过 showModal() 打开：
 * 这样 Esc 可以关闭、焦点会被限制在弹窗内、背景不可交互。
 *
 * 用法：
 *   const { onDialogClose: onFooClose } = useModalDialog('fooDialog', () => !!selected.value, () => { selected.value = null })
 *   <dialog ref="fooDialog" class="modal" @close="onFooClose">...</dialog>
 */
export function useModalDialog(refKey: string, isOpen: () => boolean, onClose: () => void) {
    const dialogRef = useTemplateRef<HTMLDialogElement>(refKey)

    watch(
        [isOpen, dialogRef],
        ([open, dialog]) => {
            if (!dialog) return
            if (open && !dialog.open) dialog.showModal()
            else if (!open && dialog.open) dialog.close()
        },
        { flush: 'post', immediate: true },
    )

    // Esc、method="dialog" 表单或 close() 都会触发 close 事件；仅在状态仍为打开时同步回去
    function onDialogClose() {
        if (isOpen()) onClose()
    }

    onBeforeUnmount(() => {
        if (dialogRef.value?.open) dialogRef.value.close()
    })

    return { dialogRef, onDialogClose }
}
