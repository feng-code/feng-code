export const coursePaths = [
  {
    id: "rtos",
    title: "RTOS 多任务设计课程路径",
    audience: "适合正在做 ThreadX / FreeRTOS / RTOS 项目任务拆分的人。",
    goal: "建立任务、队列、事件、状态机、共享资源和异常恢复的完整设计框架。",
    lessons: [
      {
        slug: "rtos-task-design",
        title: "任务、事件、队列、状态机如何分层",
        goal: "先建立 RTOS 多任务框架的核心边界。",
      },
      {
        slug: "architecture-design",
        title: "RTOS 多任务框架工程化落地",
        goal: "把任务拆分、队列设计、状态机和异常恢复串成项目框架。",
      },
    ],
  },
  {
    id: "tbox",
    title: "TBOX 项目复盘课程路径",
    audience: "适合正在做车载 TBOX、IoT 网关、低功耗和云端上报链路的人。",
    goal: "建立系统休眠、外设唤醒、总线使能、协议执行、ACK、事件上报和云端确认的分层思维。",
    lessons: [
      {
        slug: "tbox-low-power-chain",
        title: "低功耗链路复盘：唤醒信号不等于系统唤醒",
        goal: "理解低功耗链路中每一层的控制边界和验证方法。",
      },
    ],
  },
  {
    id: "driver",
    title: "驱动与协议调试课程路径",
    audience: "适合正在调试 UART、DMA、RS485、协议解析和异常数据的人。",
    goal: "建立驱动层与协议层边界，掌握半包、粘包、错包和流式解析验证方法。",
    lessons: [
      {
        slug: "uart-dma-idle-parser",
        title: "UART DMA + IDLE 接收：为什么协议层还需要流式解析",
        goal: "理解 DMA/IDLE 只能搬运字节，协议完整性必须由协议层保证。",
      },
    ],
  },
  {
    id: "growth",
    title: "嵌入式架构师成长课程路径",
    audience: "适合想提升源码阅读、工程复盘和系统设计能力的嵌入式工程师。",
    goal: "从源码抓手、调用链、工程取舍和复盘方法建立长期成长体系。",
    lessons: [
      {
        slug: "source-reading-method",
        title: "源码阅读方法：先抓结构体，再看谁赋值、谁读取",
        goal: "掌握源码阅读的工程化入口和验证方法。",
      },
    ],
  },
];
